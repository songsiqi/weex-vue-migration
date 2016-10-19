const babel = require('babel-core')
const rewriter = require('./rewriter')

let dataConfig
let requires

const visitor = {
  CallExpression (path) {
    rewriter.rewriteEl(path)
    const depsInScript = rewriter.rewriteRequire(path)
    depsInScript.forEach((dep) => {
      requires.push(dep)
    })
  },

  AssignmentExpression (path) {
    rewriter.rewriteExport(path, dataConfig, requires)
  },

  ExportDefaultDeclaration (path) {
    rewriter.rewriteExport(path, dataConfig, requires)
  },

  ImportDeclaration (path) {
    const depsInScript = rewriter.rewriteImport(path)
    depsInScript.forEach((dep) => {
      requires.push(dep)
    })
  }
}

/**
 * Rewrite `<script>`
 *
 * @param {String} `<script>` code
 * @param {Object} `<script type="data">` data
 * @return {String} result
 */
function rewrite (code, data, deps = []) {
  dataConfig = data
  requires = deps.map((dep) => `./${dep}.vue`)
  const result = babel.transform(code, { // TODO: other babel options
    sourceType: 'module',
    plugins: [{ visitor }]
  })
  // console.log(JSON.stringify(result.ast.program, null, 2))
  return result.code
}

exports.rewrite = rewrite
