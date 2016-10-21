const Path = require('path')
const t = require('babel-types')
const template = require('babel-template')
const util = require('../util')

/**
 * Rewrite `$el` to `$refs`
 *  TODO:
 *  - const $el = this.$el
 *  - $el('xxx')
 *  - const $ = this.$el
 *  - const self = this
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
    node.callee.property &&
    node.callee.property.name === '$el' &&
    node.arguments && node.arguments.length
  ) {
    path.replaceWith(
      t.MemberExpression(
        t.MemberExpression(
          t.identifier(node.callee.object.name),
          t.identifier('$refs')
        ),
        t.stringLiteral(node.arguments[0].value),
        true
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
    node.left.object.name === 'module' &&
    node.left.property.name === 'exports' &&
    node.right.type === 'ObjectExpression'
  ) {
    rewriteOptions(node.right.properties, dataConfig, requires, elements)
  }

  // options in `export default`
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
  if (requires && requires.length) {
    insertComponents(properties, requires, elements)
  }
}

/**
 * Insert `components`
 *
 * Weex:
 *  <item-a></item-a>
 *  require('weex-components/item-b.we')
 *  <element name="item-c"></element>
 * Vue:
 *  components: {
 *    itemA: require('weex-vue-components/item-a.vue'),
 *    itemB: require('weex-vue-components/item-b.vue'),
 *    itemC: {
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
        [t.StringLiteral(dep)]
      )
    )
  })

  elements.forEach((element) => {
    const { name, templateContent, styleContent, scriptExport } = element
    if (templateContent) {
      scriptExport.push(t.ObjectProperty(
        t.Identifier('template'),
        t.stringLiteral(templateContent)
      ))
    }
    if (styleContent) {
      scriptExport.push(t.ObjectProperty(
        t.Identifier('style'),
        t.stringLiteral(styleContent)
      ))
    }
    const elementAst = t.ObjectProperty(
      t.Identifier(util.hyphenedToCamelCase(name)),
      t.ObjectExpression(scriptExport)
    )
    components.push(elementAst)
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
 *  TODO: deal with statements before `return` in data function
 *
 * Weex:
 *  module.exports = {
 *    data: {
 *      level: 1
 *    }
 *  }
 *  module.exports = {
 *    data: function () {
 *      return {
 *        level: 1
 *      }
 *    }
 *  }
 *  module.exports = {
 *    data() {
 *      return {
 *        level: 1
 *      }
 *    }
 *  }
 * Vue:
 *  module.exports = {
 *    props: {
 *      level: { default: 1 }
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
      else if (property.value.type === 'FunctionExpression' &&
        property.value.body &&
        property.value.body.type === 'BlockStatement' &&
        property.value.body.body &&
        property.value.body.body.length
      ) {
        property.value.body.body.forEach((statement) => {
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
      if (property.body &&
        property.body.type === 'BlockStatement' &&
        property.body.body &&
        property.body.body.length
      ) {
        property.body.body.forEach((statement) => {
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
    prop.value = t.ObjectExpression([
      t.ObjectProperty(
        t.Identifier('default'),
        prop.value
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

  if (node.callee &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments && node.arguments.length &&
    node.arguments[0].type === 'StringLiteral' &&
    Path.extname(node.arguments[0].value) === '.we'
  ) {
    const dep = node.arguments[0].value.slice(0, -2) + 'vue'
    deps.push(dep)
    const { type } = parentPath.node
    if (type === 'ExpressionStatement' || type === 'VariableDeclarator') {
      parentPath.remove()
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

  if (node.source &&
    node.source.type === 'StringLiteral' &&
    Path.extname(node.source.value) === '.we'
  ) {
    const dep = node.source.value.slice(0, -2) + 'vue'
    deps.push(dep)
    path.remove()
  }

  return deps
}

module.exports = {
  rewriteEl,
  rewriteExport,
  rewriteRequire,
  rewriteImport
}
