const babel = require('babel-core')
const rewriter = require('./rewriter')
const util = require('../util')

let dataConfig
let requires
let elements

const visitor = {
  CallExpression (path) {
    rewriter.rewriteEl(path)
    rewriter.rewriteEvent(path)
    const requiresInScript = rewriter.rewriteRequire(path)
    requires = util.removeDuplicatedRequires(requires, requiresInScript)
  },

  AssignmentExpression (path) {
    rewriter.rewriteExport(path, dataConfig, requires, elements)
  },

  ExportDefaultDeclaration (path) {
    rewriter.rewriteExport(path, dataConfig, requires, elements)
  },

  ImportDeclaration (path) {
    const requiresInScript = rewriter.rewriteImport(path)
    requires = util.removeDuplicatedRequires(requires, requiresInScript)
  }
}

/**
 * Rewrite `<script>`
 *
 * @param {String} `<script>` code
 * @param {Object} params<data, deps, elementList>
 * @return {Object} result<code, map, ast>
 */
function rewrite (code, { data, deps = [], elementList = [] }) {
  dataConfig = data
  requires = util.formatDepsToRequires(deps)
  elements = elementList
  const result = babel.transform(code, {
    sourceType: 'module',
    plugins: [{ visitor }]
  })
  // console.log(JSON.stringify(result.ast.program, null, 2))
  return result
}

exports.rewrite = rewrite
