const babel = require('babel-core')
const rewriter = require('./rewriter')

let dataConfig

const visitor = {
  CallExpression (path) {
    rewriter.rewriteEl(path)
  },

  AssignmentExpression (path) {
    rewriter.rewriteOptions(path, dataConfig)
  },

  ExportDefaultDeclaration (path) {
    rewriter.rewriteOptions(path, dataConfig)
  }
}

/**
 * Rewrite `<script>`
 *
 * @param {String} `<script>` code
 * @param {Object} `<script type="data">` data
 * @return {String} result
 */
function rewrite (code, data) {
  dataConfig = data
  const result = babel.transform(code, { // TODO: babel的其他选项
    sourceType: 'module',
    plugins: [{ visitor }]
  })
  // console.log(JSON.stringify(result.ast.program, null, 2))
  return result.code
}

exports.rewrite = rewrite
