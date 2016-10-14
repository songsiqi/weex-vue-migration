const babel = require('babel-core')
const rewriter = require('./rewriter')

const visitor = {
  CallExpression (path) {
    rewriter.rewriteEl(path)
  },

  AssignmentExpression (path) {
    rewriter.rewriteData(path)
  },

  ExportDefaultDeclaration (path) {
    rewriter.rewriteData(path)
  }
}

function rewrite (code) {
  const result = babel.transform(code, { // TODO: babel的其他选项
    sourceType: 'module',
    plugins: [{ visitor }]
  })
  // console.log(JSON.stringify(result.ast.program, null, 2))
  return result.code
}

exports.rewrite = rewrite
