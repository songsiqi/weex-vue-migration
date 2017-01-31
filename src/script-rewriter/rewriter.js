const Path = require('path')
const t = require('babel-types')
const template = require('babel-template')
const { hyphenedToCamelCase } = require('../util')

/**
 * Rewrite `$el` to `$refs`
 *
 * Weex:
 *  this.$el('xxx')
 * Vue:
 *  this.$refs['xxx']
 *
 * @param {Node} path of `CallExpression`
 */
function rewriteEl (path) {
  const { node } = path

  if (node.callee &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object &&
    (node.callee.object.type === 'ThisExpression' ||
    node.callee.object.type === 'Identifier') &&
    node.callee.property &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === '$el' &&
    node.arguments && node.arguments.length
  ) {
    const objectExp = node.callee.object.type === 'ThisExpression' ?
      t.ThisExpression() :
      t.Identifier(node.callee.object.name)

    path.replaceWith(
      t.MemberExpression(
        t.MemberExpression(
          objectExp,
          t.Identifier('$refs')
        ),
        node.arguments[0],
        true
      )
    )
  }
}

/**
 * Rewrite `$dispatch` and `$broadcast` to `$emit`
 * This is not fully equivalent, so still have to hand-tune the code.
 *
 * Weex:
 *  this.$dispatch('xxx')
 *  this.$broadcast('xxx')
 * Vue:
 *  this.$emit['xxx']
 *
 * @param {Node} path of `CallExpression`
 */
function rewriteEvent (path) {
  const { node } = path

  if (node.callee &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object &&
    (node.callee.object.type === 'ThisExpression' ||
    node.callee.object.type === 'Identifier') &&
    node.callee.property &&
    node.callee.property.type === 'Identifier' &&
    (node.callee.property.name === '$dispatch' ||
    node.callee.property.name === '$broadcast') &&
    node.arguments && node.arguments.length
  ) {
    const objectExp = node.callee.object.type === 'ThisExpression' ?
      t.ThisExpression() :
      t.Identifier(node.callee.object.name)

    path.replaceWith(
      t.callExpression(
        t.MemberExpression(
          objectExp,
          t.Identifier('$emit')
        ),
        node.arguments
      )
    )
  }
}

/**
 * Rewrite weex export
 *
 * @param {Node} path of `AssignmentExpression` or `ExportDefaultDeclaration`
 * @param {Object} params<data, requires, isEntry>
 */
function rewriteExport (path, params) {
  const { node } = path

  // options in `module.exports`
  if (node.type === 'AssignmentExpression' &&
    node.operator === '=' &&
    node.left.type === 'MemberExpression' &&
    node.left.object &&
    node.left.object.type === 'Identifier' &&
    node.left.object.name === 'module' &&
    node.left.property &&
    node.left.property.type === 'Identifier' &&
    node.left.property.name === 'exports' &&
    node.right.type === 'ObjectExpression'
  ) {
    const { properties } = node.right
    rewriteOptions(properties, params)
  }

  // options in `export default`
  /* istanbul ignore else */
  else if (node.type === 'ExportDefaultDeclaration' &&
    node.declaration.type === 'ObjectExpression'
  ) {
    const { properties } = node.declaration
    rewriteOptions(properties, params)
  }
}

/**
 * Rewrite weex export options
 *
 * @param {Array} properties
 * @param {Object} params<data, requires, isEntry>
 */
function rewriteOptions (properties, params) {
  const { data, requires, isEntry } = params
  rewriteDataOptions(properties, isEntry)
  rewriteReady(properties)
  if (data) {
    rewriteDataConfig(properties, data, isEntry)
  }
  if (requires && requires.length) {
    insertComponents(properties, requires)
  }
}

/**
 * Insert `components`
 *
 * Weex:
 *  <item-a></item-a>
 *  require('weex-components/item-b.we')
 *  import 'weex-components/item-c.we'
 *  <element name="item-d"></element>
 * Vue:
 *  components: {
 *    itemA: require('./item-a.vue'),
 *    itemB: require('weex-vue-components/item-b.vue'),
 *    itemC: require('weex-vue-components/item-c.vue'),
 *    itemD: require('./$elements-include/item-d.vue')
 *  }
 *
 * @param {Array} properties
 * @param {Array} requires
 */
function insertComponents (properties, requires) {
  const components = requires.map((dep) => {
    let key = Path.basename(dep, '.vue')
    key = hyphenedToCamelCase(key)
    return t.ObjectProperty(
      t.Identifier(key),
      t.CallExpression(
        t.Identifier('require'),
        [t.StringLiteral(dep.replace(/\/wxc-/, '/'))]
      )
    )
  })

  const ast = t.ObjectProperty(
    t.Identifier('components'),
    t.ObjectExpression(components)
  )
  properties.unshift(ast)
}

/**
 * Rewrite `<script type="data">` to `data`
 *
 * Weex:
 *  <script type="data">
 *    { a: 1 }
 *  </script>
 * Vue:
 *  module.exports = {
 *    data: function () {
 *      return {
 *        a: 1
 *      }
 *    }
 *  }
 *
 * @param {Array} properties
 * @param {String} dataConfig of `<script type="data">`
 * @param {Boolean} isEntry
 */
function rewriteDataConfig (properties, dataConfig, isEntry) {
  const buildData = template(`
    function data () { return ${dataConfig}; }
  `)
  const dataFucAst = buildData()
  dataFucAst.type = 'FunctionExpression'
  dataFucAst.id = null
  const ast = t.ObjectProperty(
    t.Identifier('data'),
    dataFucAst
  )
  const dataAst = dataFucAst.body.body[0].argument.properties

  let dataInserted = false

  // Find `data: function () { return { ... } }` and insert dataConfig
  if (isEntry) {
    properties.forEach((property) => {
      /* istanbul ignore else */
      if (property.type === 'ObjectProperty' &&
        property.key.name === 'data' &&
        property.value.type === 'FunctionExpression' &&
        property.value.body &&
        property.value.body.type === 'BlockStatement' &&
        property.value.body.body &&
        property.value.body.body.length
      ) {
        property.value.body.body.forEach((statement) => {
          /* istanbul ignore else */
          if (statement.type === 'ReturnStatement' &&
            statement.argument.type === 'ObjectExpression' &&
            statement.argument.properties
          ) {
            dataInserted = true
            Array.prototype.push.apply(statement.argument.properties, dataAst)
          }
        })
      }
    })
  }

  if (!dataInserted && dataAst.length) {
    properties.unshift(ast)
  }
}

/**
 * Rewrite `data` options
 *
 * Weex:
 *  module.exports = {
 *    data: {
 *      num: 1,
 *      obj: { a: 1 }
 *    }
 *  }
 *  module.exports = {
 *    data: function () {
 *      return {
 *        num: 1,
 *        obj: { a: 1 }
 *      }
 *    }
 *  }
 *  module.exports = {
 *    data() {
 *      return {
 *        num: 1,
 *        obj: { a: 1 }
 *      }
 *    }
 *  }
 * Vue (entry file):
 *  module.exports = {
 *    props: {
 *      num: { default: 1 },
 *      obj: {
 *        default: function () {
 *          return { a: 1 }
 *        }
 *      }
 *    }
 *  }
 * Vue (non-entry file):
 *  module.exports = {
 *    data: function () {
 *      return {
 *        num: 1,
 *        obj: { a: 1 }
 *      }
 *    }
 *  }
 *
 * So does `export default`
 *
 * @param {Array} properties
 * @param {Boolean} isEntry
 */
function rewriteDataOptions (properties, isEntry) {
  properties.forEach((property) => {
    if (property.type === 'ObjectProperty' && property.key.name === 'data') {
      // case 1: `data: { ... }`
      if (property.value.type === 'ObjectExpression' &&
        property.value.properties &&
        property.value.properties.length
      ) {
        rewriteDataNode(property, property.value.properties, isEntry)
      }

      // case 2: `data: function () { return { ... } }`
      /* istanbul ignore else */
      else if (property.value.type === 'FunctionExpression' &&
        property.value.body &&
        property.value.body.type === 'BlockStatement' &&
        property.value.body.body &&
        property.value.body.body.length
      ) {
        property.value.body.body.forEach((statement) => {
          /* istanbul ignore else */
          if (statement.type === 'ReturnStatement' &&
            statement.argument.type === 'ObjectExpression' &&
            statement.argument.properties &&
            statement.argument.properties.length
          ) {
            rewriteDataNode(property, statement.argument.properties, isEntry)
          }
        })
      }
    }

    // case 3: `data() { return { ... } }`
    else if (property.type === 'ObjectMethod' &&
      property.kind === 'method' &&
      property.key.name === 'data'
    ) {
      /* istanbul ignore else */
      if (property.body &&
        property.body.type === 'BlockStatement' &&
        property.body.body &&
        property.body.body.length
      ) {
        property.body.body.forEach((statement) => {
          /* istanbul ignore else */
          if (statement.type === 'ReturnStatement' &&
            statement.argument.type === 'ObjectExpression' &&
            statement.argument.properties &&
            statement.argument.properties.length
          ) {
            rewriteDataNode(property, statement.argument.properties, isEntry)
          }
        })
      }
    }
  })
}

/**
 * Rewrite `ready` method to `mounted` method
 *
 * Weex:
 *  module.exports = {
 *    ready: function () {
 *      this.init();
 *    }
 *  };
 *  module.exports = {
 *    ready() {
 *      this.init();
 *    }
 *  };
 * Vue:
 *  module.exports = {
 *    mounted: function () {
 *      this.init();
 *    }
 *  };
 *  module.exports = {
 *    mounted() {
 *      this.init();
 *    }
 *  };
 *
 * So does `export default`
 *
 * @param {Array} properties
 */
function rewriteReady (properties) {
  properties.forEach((property) => {
    if (
      // case 1: `ready: function () { ... }`
      (property.type === 'ObjectProperty' &&
      property.key.name === 'ready' &&
      property.value.type === 'FunctionExpression' &&
      property.value.body &&
      property.value.body.type === 'BlockStatement' &&
      property.value.body.body &&
      property.value.body.body.length) ||
      // case 2: `ready() { ... }`
      (property.type === 'ObjectMethod' &&
      property.kind === 'method' &&
      property.key.name === 'ready' &&
      property.body &&
      property.body.type === 'BlockStatement' &&
      property.body.body &&
      property.body.body.length
    )) {
      property.key.name = 'mounted'
      property.key.loc.identifierName = 'mounted'
    }
  })
}

/**
 * Rewrite `data` node
 *
 * @param {Node} property
 * @param {Array} data
 * @param {Boolean} isEntry
 */
function rewriteDataNode (property, data, isEntry) {
  // Format to `data: function () { return { ... } }`
  if (isEntry) {
    property.value = t.FunctionExpression(
      null,
      [],
      t.BlockStatement(
        [t.ReturnStatement(
          t.ObjectExpression(data)
        )]
      )
    )
  }

  // Rewrite `data` node to `props` node
  else {
    data.forEach((prop) => {
      let defaultValue = prop.value

      // object/array defaults should be returned from a factory function
      if (defaultValue.type === 'ObjectExpression' ||
        defaultValue.type === 'ArrayExpression'
      ) {
        defaultValue = t.FunctionExpression(
          null,
          [],
          t.BlockStatement(
            [t.ReturnStatement(defaultValue)]
          )
        )
      }

      prop.value = t.ObjectExpression([
        t.ObjectProperty(
          t.Identifier('default'),
          defaultValue
        )
      ])
    })

    property.key.name = 'props'
    property.key.loc.identifierName = 'props'
    property.value = t.ObjectExpression(data)
  }

  property.type = 'ObjectProperty'
  property.kind = null
}

/**
 * Rewrite and collect `require`
 *
 * @param {Node} path of `CallExpression`
 * @return {Array} deps
 */
function rewriteRequire (path) {
  const { node, parentPath } = path
  const deps = []

  function removeRequire () {
    const { type } = parentPath.node
    /* istanbul ignore else */
    if (type === 'ExpressionStatement' || type === 'VariableDeclarator') {
      parentPath.remove()
    }
  }

  if (node.callee &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments && node.arguments.length &&
    node.arguments[0].type === 'StringLiteral'
  ) {
    const { value } = node.arguments[0]
    if (Path.extname(value) === '.we') {
      deps.push(value.slice(0, -2) + 'vue')
      removeRequire()
    }
    else if (value === 'weex-components') {
      removeRequire()
    }
    else if (value === '@weex-module/dom') {
      // rewrite `require('@weex-module/dom')` to `weex.requireModule('dom')`
      node.callee = t.MemberExpression(
        t.Identifier('weex'),
        t.Identifier('requireModule')
      )
      node.arguments[0].value = 'dom'
    }
  }

  return deps
}

/**
 * Rewrite and collect `import`
 *
 * @param {Node} path of `ImportDeclaration`
 * @return {Array} deps
 */
function rewriteImport (path) {
  const { node } = path
  const deps = []

  /* istanbul ignore else */
  if (node.source && node.source.type === 'StringLiteral') {
    const { value } = node.source
    if (Path.extname(value) === '.we') {
      deps.push(value.slice(0, -2) + 'vue')
      path.remove()
    }
    else if (value === 'weex-components') {
      path.remove()
    }
  }

  return deps
}

module.exports = {
  rewriteEl,
  rewriteEvent,
  rewriteExport,
  rewriteRequire,
  rewriteImport
}
