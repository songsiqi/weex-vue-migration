const babel = require('babel-core')
const rewriter = require('./rewriter')

let dataConfig
let requires
let elements

const visitor = {
  CallExpression (path) {
    rewriter.rewriteEl(path)
    const depsInScript = rewriter.rewriteRequire(path)
    depsInScript.forEach((dep) => {
      requires.push(dep)
    })
  },

  AssignmentExpression (path) {
    rewriter.rewriteExport(path, dataConfig, requires, elements)
  },

  ExportDefaultDeclaration (path) {
    rewriter.rewriteExport(path, dataConfig, requires, elements)
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
 * @param {Object} params<data, deps, elementList>
 * @return {Object} result<code, map, ast>
 */
function rewrite (code, { data, deps = [], elementList = [] }) {
  dataConfig = data
  deps = deps.filter((dep) => {
    return elementList.map((element) => element.name).indexOf(dep) === -1
  })
  requires = deps.map((dep) => `./${dep}.vue`)
  elements = elementList
  const result = babel.transform(code, {
    sourceType: 'module',
    plugins: [{ visitor }]
  })
  // console.log(JSON.stringify(result.ast.program, null, 2))
  return result
}

exports.rewrite = rewrite
