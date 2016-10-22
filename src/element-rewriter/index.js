const t = require('babel-types')
const parse5 = require('parse5')
const block = require('../block')
const templateRewriter = require('../template-rewriter')
const scriptRewriter = require('../script-rewriter')
const util = require('../util')

/**
 * Rewrite `<element>`
 *
 * @param {Node} element
 * @param {Array} deps
 * @return {Object} elementAst
 */
function rewrite (element, deps) {
  const { name } = element
  const { template, style, script } = block(element)
  let scriptExport = []

  if (script) {
    const scriptContent = script.childNodes[0].value
    const scriptResult = scriptRewriter.rewrite(scriptContent, {})

    if (scriptResult.ast.program &&
      scriptResult.ast.program.body &&
      scriptResult.ast.program.body.length
    ) {
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
    }
  }

  if (template) {
    const templateNode = templateRewriter.rewrite(template.content, deps)
    const templateContent = parse5.serialize(templateNode)
    scriptExport.unshift(t.ObjectProperty(
      t.Identifier('template'),
      t.stringLiteral(templateContent)
    ))
  }

  if (style) {
    const styleContent = style.childNodes[0].value
    scriptExport.unshift(t.ObjectProperty(
      t.Identifier('style'),
      t.stringLiteral(styleContent)
    ))
  }

  const elementAst = t.ObjectProperty(
    t.Identifier(util.hyphenedToCamelCase(name)),
    t.ObjectExpression(scriptExport)
  )
  elementAst.name = name

  return elementAst
}

exports.rewrite = rewrite
