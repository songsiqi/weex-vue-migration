const t = require('babel-types')

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
 * Rewrite `data` to `props`
 *  TODO: deal with statements before `return` in data function
 *
 * Weex:
 *  module.exports = {
 *    data: {
 *      level: 1,
 *      value: ''
 *    }
 *  }
 *  module.exports = {
 *    data: function () {
 *      return {
 *        level: 1,
 *        value: ''
 *      }
 *    }
 *  }
 *  module.exports = {
 *    data() {
 *      return {
 *        level: 1,
 *        value: ''
 *      }
 *    }
 *  }
 * Vue:
 *  module.exports = {
 *    props: {
 *      level: { default: 1 },
 *      value: { default: '' }
 *    }
 *  }
 *
 *  So does `export default`
 *
 * @param {Node} path of `AssignmentExpression` or `ExportDefaultDeclaration`
 */
function rewriteData (path) {
  const { node } = path

  // `data` in `module.exports`
  if (node.type === 'AssignmentExpression' &&
    node.operator === '=' &&
    node.left.object.name === 'module' &&
    node.left.property.name === 'exports' &&
    node.right.type === 'ObjectExpression'
  ) {
    locateData(node.right.properties)
  }

  // `data` in `export default`
  else if (node.type === 'ExportDefaultDeclaration' &&
    node.declaration.type === 'ObjectExpression'
  ) {
    locateData(node.declaration.properties)
  }
}

/**
 * Locate and rewrite `data` property
 *
 * @param {Node} properties
 */
function locateData (properties) {
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
  rewriteData
}
