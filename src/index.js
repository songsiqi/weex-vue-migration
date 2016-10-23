const parse5 = require('parse5')
const block = require('./block')
const util = require('./util')
const templateRewriter = require('./template-rewriter')
const scriptRewriter = require('./script-rewriter')
const elementRewriter = require('./element-rewriter')

/**
 * Transform from `*.we` file into `*.vue` file
 *
 * @param {string} weexCode
 * @return {string} vueCode
 */
function transform (weexCode) {
  const parserOptions = {
    treeAdapter: parse5.treeAdapters.default,
    locationInfo: true
  }
  const doc = parse5.parseFragment(weexCode, parserOptions)
  const { template, script, data, elements } = block(doc)

  let deps = []
  let elementList = []

  if (elements && elements.length) {
    elementList = elements.map((element) => {
      return elementRewriter.rewrite(element, deps)
    })
  }

  /* istanbul ignore else */
  if (template) {
    templateRewriter.rewrite(template.content, deps)
    deps = util.getCustomComponents(deps)
  }

  /* istanbul ignore else */
  if (script) {
    const scriptContent = script.childNodes[0].value
    const options = { data, deps, elementList }
    const scriptResult = scriptRewriter.rewrite(scriptContent, options)
    script.childNodes[0].value = scriptResult.code
  }

  const vueCode = parse5.serialize(doc)
  return vueCode
}

exports.transform = transform
