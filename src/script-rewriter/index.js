const babel = require('babel-core')
const rewriter = require('./rewriter')
const util = require('../util')

/**
 * Rewrite `<script>`
 *
 * @param {String} `<script>` code
 * @param {Object} params<data, deps, elementList, isEntry>
 * @return {Object} result<code, map, ast>
 */
function rewrite (code, { data, deps = [], elementList = [], isEntry }) {
  const requires = util.formatDepsToRequires(deps)
  const params = { data, requires, elementList, isEntry }

  const visitor = {
    CallExpression (path) {
      rewriter.rewriteEl(path)
      rewriter.rewriteEvent(path)
      const requiresInScript = rewriter.rewriteRequire(path)
      util.removeDuplicatedRequires(requires, requiresInScript)
    },

    AssignmentExpression (path) {
      rewriter.rewriteExport(path, params)
    },

    ExportDefaultDeclaration (path) {
      rewriter.rewriteExport(path, params)
    },

    ImportDeclaration (path) {
      const requiresInScript = rewriter.rewriteImport(path)
      util.removeDuplicatedRequires(requires, requiresInScript)
    }
  }

  const result = babel.transform(code, {
    sourceType: 'module',
    plugins: [{ visitor }]
  })

  // console.log(JSON.stringify(result.ast.program, null, 2))
  return result
}

exports.rewrite = rewrite
