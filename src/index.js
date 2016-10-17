const parse5 = require('parse5')
const templateRewriter = require('./template-rewriter')
const scriptRewriter = require('./script-rewriter')

/**
 * Parse weex file into blocks
 *
 * @param {Node} doc
 * @return {object} result
 */
function block (doc) {
  const result = {}
  const { childNodes } = doc

  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i]
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
          if (type === 'data') { // delete `<script type="data">`
            childNodes.splice(i, 1)
            i--
          }
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
  }

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
  const { template, scripts, data } = block(doc)

  const deps = []
  if (template) {
    templateRewriter.rewrite(template.content, deps)
  }

  let dataConfig = ''
  if (data && data.childNodes) {
    data.childNodes.forEach((child) => {
      if (child.nodeName === '#text') {
        dataConfig += child.value
      }
    })
    dataConfig = new Function('return ' + dataConfig.replace(/\n/g, ''))()
    dataConfig = JSON.stringify(dataConfig)
  }

  if (scripts) {
    scripts.forEach((script) => {
      if (script.childNodes) {
        script.childNodes.forEach((child) => {
          if (child.nodeName === '#text') {
            child.value = scriptRewriter.rewrite(child.value, dataConfig)
          }
        })
      }
    })
  }

  const vueCode = parse5.serialize(doc)
  return vueCode
}

exports.transform = transform
