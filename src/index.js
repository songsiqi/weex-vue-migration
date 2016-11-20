const parse5 = require('parse5')
const block = require('./block')
const templateRewriter = require('./template-rewriter')
const scriptRewriter = require('./script-rewriter')
const elementRewriter = require('./element-rewriter')

/**
 * Transform from `*.we` file into `*.vue` file
 *
 * @param {String} weexCode
 * @param {Boolean} isEntry
 * @return {String} vueCode
 */
function transform (weexCode, isEntry) {
  const parserOptions = {
    treeAdapter: parse5.treeAdapters.default,
    locationInfo: true
  }
  const doc = parse5.parseFragment(weexCode, parserOptions)
  const { template, script, data, elements } = block(doc)

  let deps = []
  let elementList = []

  /* istanbul ignore else */
  if (template) {
    templateRewriter.rewrite(template.content, deps)
  }

  if (elements && elements.length) {
    elementList = elements.map((element) => {
      return elementRewriter.rewrite(element, deps)
    })
    deps = deps.filter((dep) => {
      return elementList.map((element) => element.name).indexOf(dep) === -1
    })
  }

  /* istanbul ignore else */
  if (script) {
    const scriptContent = script.childNodes[0].value
    const options = { data, deps, elementList, isEntry }
    const scriptResult = scriptRewriter.rewrite(scriptContent, options)
    script.childNodes[0].value = scriptResult.code
  }

  const vueCode = parse5.serialize(doc)
  return vueCode
}

exports.transform = transform
