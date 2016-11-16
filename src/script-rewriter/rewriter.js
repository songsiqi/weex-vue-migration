const Path = require('path')
const t = require('babel-types')
const template = require('babel-template')
const util = require('../util')

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
      t.identifier(node.callee.object.name)

    path.replaceWith(
      t.MemberExpression(
        t.MemberExpression(
          objectExp,
          t.identifier('$refs')
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
      t.identifier(node.callee.object.name)

    path.replaceWith(
      t.callExpression(
        t.MemberExpression(
          objectExp,
          t.identifier('$emit')
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
 * @param {String} dataConfig of `<script type="data">`
 * @param {Array} requires (contain implicit `deps`)
 * @param {Array} elements
 */
function rewriteExport (path, dataConfig, requires, elements) {
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
    rewriteOptions(node.right.properties, dataConfig, requires, elements)
  }

  // options in `export default`
  /* istanbul ignore else */
  else if (node.type === 'ExportDefaultDeclaration' &&
    node.declaration.type === 'ObjectExpression'
  ) {
    rewriteOptions(node.declaration.properties, dataConfig, requires, elements)
  }
}

/**
 * Rewrite weex export options
 *
 * @param {Array} properties
 * @param {String} dataConfig of `<script type="data">`
 * @param {Array} requires (contain implicit `deps`)
 * @param {Array} elements
 */
function rewriteOptions (properties, dataConfig, requires, elements) {
  rewriteDataToProps(properties)
  if (dataConfig) {
    rewriteDataConfig(properties, dataConfig)
  }
  if ((requires && requires.length) || (elements && elements.length)) {
    insertComponents(properties, requires, elements)
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
 *    itemA: require('weex-vue-components/item-a.vue'),
 *    itemB: require('weex-vue-components/item-b.vue'),
 *    itemC: require('weex-vue-components/item-c.vue'),
 *    itemD: {
 *      templete: '...',
 *      style: '...',
 *      ...
 *    }
 *  }
 *
 * @param  {Array} properties
 * @param  {Array} requires
 * @param  {Array} elements
 */
function insertComponents (properties, requires, elements) {
  const components = requires.map((dep) => {
    let key = Path.basename(dep, '.vue')
    key = util.hyphenedToCamelCase(key)
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
    t.ObjectExpression(components.concat(elements))
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
 */
function rewriteDataConfig (properties, dataConfig) {
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
  properties.unshift(ast)
}

/**
 * Rewrite `data` to `props`
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
 * Vue:
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
 *
 *  So does `export default`
 *
 * @param {Array} properties
 */
function rewriteDataToProps (properties) {
  properties.forEach((property) => {
    if (property.type === 'ObjectProperty' &&
      property.key.name === 'data'
    ) {
      // case 1: `data: { ... }`
      if (property.value.type === 'ObjectExpression' &&
        property.value.properties &&
        property.value.properties.length
      ) {
        rewriteDataNode(property, property.value.properties)
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
            rewriteDataNode(property, statement.argument.properties)
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
            rewriteDataNode(property, statement.argument.properties)
          }
        })
      }
    }
  })
}

/**
 * Change `data` node to `props` node
 *
 * @param {Node} property
 * @param {Array} data
 */
function rewriteDataNode (property, data) {
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

  property.type = 'ObjectProperty'
  property.key.name = 'props'
  property.kind = null
  property.value = t.ObjectExpression(data)
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
