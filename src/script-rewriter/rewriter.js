const t = require('babel-types')
const template = require('babel-template')

/**
 * Rewrite `$el` to `$refs`
 *  TODO:
 *   - const $el = this.$el
 *   - $el('xxx')
 *   - const $ = this.$el
 *   - const self = this
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
    node.callee.property.name === '$el'
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
 * Rewrite weex instance options
 *
 * @param {Node} path of `AssignmentExpression` or `ExportDefaultDeclaration`
 * @param {String} `<script type="data">` dataConfig
 */
function rewriteOptions (path, dataConfig) {
  const { node } = path

  // options in `module.exports`
  if (node.type === 'AssignmentExpression' &&
    node.operator === '=' &&
    node.left.object.name === 'module' &&
    node.left.property.name === 'exports' &&
    node.right.type === 'ObjectExpression'
  ) {
    rewriteData(node.right.properties, dataConfig)
  }

  // options in `export default`
  else if (node.type === 'ExportDefaultDeclaration' &&
    node.declaration.type === 'ObjectExpression'
  ) {
    rewriteData(node.declaration.properties, dataConfig)
  }
}

/**
 * Rewrite `data`
 *  - Rewrite `data` to `props`
 *  - Rewrite `<script type="data">` to `data`
 *
 * @param {Node} path of `AssignmentExpression` or `ExportDefaultDeclaration`
 * @param {String} `<script type="data">` dataConfig
 */
function rewriteData (properties, dataConfig) {
  rewriteDataToProps(properties)
  if (dataConfig) {
    rewriteDataConfig(properties, dataConfig)
  }
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
 * @param {String} `<script type="data">` dataConfig
 */
function rewriteDataConfig (properties, dataConfig) {
  const buildData = template(`
    function data () { return ${dataConfig}; }
  `)
  const dataFucAst = buildData()
  dataFucAst.type = 'FunctionExpression'
  dataFucAst.id = null
  const dataAst = {
    type: 'ObjectProperty',
    method: false,
    shorthand: false,
    computed: false,
    key: {
      type: 'Identifier',
      name: 'data'
    },
    value: dataFucAst
  }
  properties.unshift(dataAst)
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
    prop.value = {
      type: 'ObjectExpression',
      properties: [{
        type: 'ObjectProperty',
        method: false,
        shorthand: false,
        computed: false,
        key: {
          type: 'Identifier',
          name: 'default'
        },
        value: prop.value
      }]
    }
  })
  property.type = 'ObjectProperty'
  property.key.name = 'props'
  property.kind = null
  property.value = {
    type: 'ObjectExpression',
    properties: data
  }
}

module.exports = {
  rewriteEl,
  rewriteOptions
}
