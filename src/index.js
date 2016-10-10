const parse5 = require('parse5')
const templateRewriter = require('./template-rewriter')

/**
 * Parse weex file into blocks
 *
 * @param {Node} doc
 * @return {object} result
 */
function block (doc) {
  const result = {}

  doc.childNodes.forEach((child) => {
    switch (child.nodeName) {
      case 'template':
        result.template = result.template || child
        break
      case 'style':
        result.styles = result.styles || []
        result.styles.push(child)
        break
      case 'script':
        const attrs = child.attrs || []
        let type
        attrs.forEach((attr) => {
          if (attr.name === 'type') {
            type = attr.value
          }
        })
        if (type) {
          result[type] = result[type] || child
        }
        else {
          result.scripts = result.scripts || []
          result.scripts.push(child)
        }
        break
      case 'element':
      case 'wx-element':
      case 'wa-element':
      case 'we-element':
        result.elements = result.elements || []
        result.elements.push(child)
        break
      default:
        break
    }
  })

  return result
}

/**
 * Transform from `*.we` file into `*.vue` file
 *
 * @param {string} weexCode
 * @return {string} vueCode
 */
function transform (weexCode) {
  const options = {
    treeAdapter: parse5.treeAdapters.default,
    locationInfo: true
  }
  const doc = parse5.parseFragment(weexCode, options)
  const { template } = block(doc)

  if (template) {
    templateRewriter.rewrite(template.content)
  }

  const vueCode = parse5.serialize(doc)
  return vueCode
}

exports.transform = transform
