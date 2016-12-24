const babel = require('babel-core')
const rewriter = require('./rewriter')
const {
  formatDepsToRequires,
  formatElementsToRequires,
  removeDuplicatedRequires
} = require('../util')

/**
 * Rewrite `<script>`
 *
 * @param {String} `<script>` code
 * @param {Object} params<data, deps, elements, isEntry>
 * @return {Object} result<code, map, ast>
 */
function rewrite (code, { data, deps = [], elements = [], isEntry }) {
  const requires = formatDepsToRequires(deps)
  Array.prototype.push.apply(requires, formatElementsToRequires(elements))
  const params = { data, requires, isEntry }

  const visitor = {
    CallExpression (path) {
      rewriter.rewriteEl(path)
      rewriter.rewriteEvent(path)
      const requiresInScript = rewriter.rewriteRequire(path)
      removeDuplicatedRequires(requires, requiresInScript)
    },

    AssignmentExpression (path) {
      rewriter.rewriteExport(path, params)
    },

    ExportDefaultDeclaration (path) {
      rewriter.rewriteExport(path, params)
    },

    ImportDeclaration (path) {
      const requiresInScript = rewriter.rewriteImport(path)
      removeDuplicatedRequires(requires, requiresInScript)
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
