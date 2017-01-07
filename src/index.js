const parse5 = require('parse5')
const block = require('./block')
const templateRewriter = require('./template-rewriter')
const styleRewriter = require('./style-rewriter')
const scriptRewriter = require('./script-rewriter')
const { ELEMENT_PATH } = require('./util')

/**
 * Transform from `*.we` file into `*.vue` file
 *
 * @param {Node|String} weexCode
 * @param {Boolean} isEntry
 * @return {Object} result<content, elements>
 */
function transform (weexCode, isEntry) {
  let doc = weexCode
  if (typeof doc === 'string') {
    const parserOptions = {
      treeAdapter: parse5.treeAdapters.default,
      locationInfo: true
    }
    doc = parse5.parseFragment(doc, parserOptions)
  }
  const { template, style, script, data, elements } = block(doc)

  let deps = []
  const elementList = []

  /* istanbul ignore else */
  if (template) {
    templateRewriter.rewrite(template.content, deps)
  }

  /* istanbul ignore else */
  if (style) {
    styleRewriter.rewrite(style)
  }

  if (elements && elements.length) {
    deps = deps.filter((dep) => {
      return elements.map((element) => element.name).indexOf(dep) === -1
    })
    elements.forEach((element) => {
      elementList.push({
        name: element.name,
        content: transform(element, false).content
      })
    })
  }

  /* istanbul ignore else */
  if (script) {
    const scriptContent = script.childNodes[0].value
    const options = { data, deps, elements, isEntry }
    const scriptResult = scriptRewriter.rewrite(scriptContent, options)
    script.childNodes[0].value = scriptResult.code
  }

  const vueCode = parse5.serialize(doc)
  return {
    content: vueCode,
    elements: elementList
  }
}

module.exports = {
  ELEMENT_PATH,
  transform
}
