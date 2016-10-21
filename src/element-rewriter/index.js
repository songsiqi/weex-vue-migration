const parse5 = require('parse5')
const block = require('../block')
const templateRewriter = require('../template-rewriter')
const scriptRewriter = require('../script-rewriter')

/**
 * Rewrite `<element>`
 *
 * @param {Node} element
 * @param {Array} deps
 * @return {Object} result
 */
function rewrite (element, deps) {
  const { name } = element
  const { template, style, script } = block(element)
  const templateNode = templateRewriter.rewrite(template.content, deps)
  const templateContent = parse5.serialize(templateNode)
  const styleContent = style.childNodes[0].value
  const scriptContent = script.childNodes[0].value
  const scriptResult = scriptRewriter.rewrite(scriptContent, {})
  let scriptExport = []

  scriptResult.ast.program.body.forEach((node) => {
    // options in `module.exports`
    if (node.type === 'ExpressionStatement' &&
      node.expression.type === 'AssignmentExpression' &&
      node.expression.operator === '=' &&
      node.expression.left.object.name === 'module' &&
      node.expression.left.property.name === 'exports' &&
      node.expression.right.type === 'ObjectExpression'
    ) {
      scriptExport = node.expression.right.properties
    }

    // options in `export default`
    else if (node.type === 'ExportDefaultDeclaration' &&
      node.declaration.type === 'ObjectExpression'
    ) {
      scriptExport = node.declaration.properties
    }
  })

  return {
    name,
    templateContent,
    styleContent,
    scriptExport
  }
}

exports.rewrite = rewrite
