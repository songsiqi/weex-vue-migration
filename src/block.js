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

  if (child.childNodes && child.childNodes.length) {
    let parentNode
    child.childNodes.forEach((child) => {
      if (child.nodeName === '#text') {
        value += child.value
        parentNode = child.parentNode
      }
    })
    if (value) {
      child.childNodes = [{
        nodeName: '#text',
        value,
        parentNode
      }]
    }

    if (value && !result[type]) {
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

  return value
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
          if (attr.name === 'type') {
            type = attr.value
          }
        })
        if (type) {
          if (type === 'data') {
            let data = normalizeTextNode(result, 'data', childNodes, i)
            data = new Function('return ' + data.replace(/\n/g, ''))()
            result.data = JSON.stringify(data)
            childNodes.splice(i, 1)
            i--
          }
          else {
            // TODO: deal with `<script type="config">`
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

  return result
}

module.exports = block
