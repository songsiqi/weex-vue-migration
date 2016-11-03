const parse5 = require('parse5')

/**
 * Normalize multiple `#text` node to one
 *
 * @param {Object} result
 * @param {String} type
 * @param {Array} childNodes
 * @param {Number} i
 * @return {String} value
 */
function normalizeTextNode (result, type, childNodes, i) {
  const child = childNodes[i]
  let value = ''

  /* istanbul ignore else */
  if (child.childNodes && child.childNodes.length) {
    let parentNode
    child.childNodes.forEach((child) => {
      /* istanbul ignore else */
      if (child.nodeName === '#text') {
        value += child.value
        parentNode = child.parentNode
      }
    })

    /* istanbul ignore else */
    if (value.trim()) {
      child.childNodes = [{
        nodeName: '#text',
        value,
        parentNode
      }]
      if (!result[type]) {
        result[type] = child
      }
      else {
        result[type].childNodes[0].value += value
        childNodes.splice(i, 1)
        i--
      }
    }
    else {
      childNodes.splice(i, 1)
      i--
    }
  }
  else {
    childNodes.splice(i, 1)
    i--
  }

  return value
}

/**
 * ensure `<script>` and `module.export`
 *
 * @param {Node} doc
 * @param {Object} result
 */
function fixScript (doc, result) {
  // FIXME: ensure there exists a `<script>` for `<element>` or implicit deps
  if (!result.script) {
    const treeAdapter = parse5.treeAdapters.default
    const namespaceUrl = 'http://www.w3.org/1999/xhtml'
    const scriptNode = treeAdapter.createElement('script', namespaceUrl, [])
    treeAdapter.insertText(scriptNode, '\n  module.exports = {}\n')
    treeAdapter.appendChild(doc, scriptNode)
    treeAdapter.insertText(doc, '\n')
    result.script = scriptNode
  }

  // FIXME: ensure there exists `module.exports` or `export default`
  else {
    const scriptContent = result.script.childNodes[0].value
    if (!/\s*module.exports\s*=\s*/.test(scriptContent) &&
      !/\s*export default\s*/.test(scriptContent)
    ) {
      result.script.childNodes[0].value += '\n  module.exports = {}\n'
    }
  }
}

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
    const attrs = child.attrs || []
    switch (child.nodeName) {
      case 'template':
        result.template = result.template || child
        break
      case 'style':
        normalizeTextNode(result, 'style', childNodes, i)
        break
      case 'script':
        let type
        attrs.forEach((attr) => {
          /* istanbul ignore else */
          if (attr.name === 'type') {
            type = attr.value
          }
        })
        if (type) {
          /* istanbul ignore else */
          if (type === 'data') {
            let data = normalizeTextNode(result, 'data', childNodes, i)
            data = new Function('return ' + data.replace(/\n/g, ''))()
            result.data = JSON.stringify(data)
            childNodes.splice(i, 1)
            i--
          }
          else {
            result[type] = result[type] || child
          }
        }
        else {
          normalizeTextNode(result, 'script', childNodes, i)
        }
        break
      case 'element':
      case 'wx-element':
      case 'wa-element':
      case 'we-element':
        attrs.forEach((attr) => {
          /* istanbul ignore else */
          if (attr.name === 'name') {
            child.name = attr.value
          }
        })
        result.elements = result.elements || []
        result.elements.push(child)
        childNodes.splice(i, 1)
        i--
        break
      default:
        break
    }
  }

  fixScript(doc, result)

  return result
}

module.exports = block
