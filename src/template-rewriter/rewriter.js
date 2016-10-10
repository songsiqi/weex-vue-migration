const exp = require('./exp')
const util = require('../util')

/**
 * Rewrite `<content>` tag
 *
 * Weex:
 *  <content></content>
 * Vue:
 *  <slot></slot>
 *
 * @param {Node} node
 */
function rewriteContentTag (node) {
  node.nodeName = node.tagName = 'slot'
}

/**
 * Rewrite text node, delete extra spaces and breaks
 *
 * Weex:
 *  <text>
 *    {{title}}
 *  </text>
 * Vue:
 *  <slot></slot>
 *
 * @param {Node} node
 */
function rewriteTextNode (node) {
  const childNodes = node.childNodes || []
  childNodes.forEach((child) => {
    if (child.nodeName === '#text') {
      child.value = child.value.trim()
    }
  })
}

/**
 * Rewrite `id`
 *
 * Weex:
 *  id="xxx"
 * Vue:
 *  ref="xxx"
 *
 * @param {Array} attrs
 * @param {Number} i
 */
function rewriteId (attrs, i) {
  const value = attrs[i].value.trim()
  const newAttr = {
    name: exp.isExpr(value) ? ':ref' : 'ref',
    value: exp(value)
  }
  attrs.splice(i, 1, newAttr)
}

/**
 * Rewrite `class`
 *
 * Weex:
 *  class="btn btn-{{type}} btn-sz-{{size}}"
 * Vue:
 *  :class="['btn', 'btn-' + type, 'btn-sz-' + size]"
 *
 * @param {Array} attrs
 * @param {Number} i
 */
function rewriteClass (attrs, i) {
  const value = attrs[i].value.trim()

  if (value) {
    // handle space in bindings
    const classPartList = value.split(' ')
    let classList = []
    let expStart = -1
    let expEnd = -1
    classPartList.forEach((classPart, index) => {
      if (classPart.indexOf('{{') > -1 && classPart.indexOf('}}') === -1) {
        expStart = index
      }
      else if (expStart !== -1 && classPart.indexOf('}}') > -1) {
        expEnd = index
        classList.push(classPartList.slice(expStart, expEnd + 1).join(''))
        expStart = expEnd = -1
      }
      else if ((expStart === -1 && expEnd === -1) ||
        (classPart.indexOf('{{') > -1 && classPart.indexOf('}}') > -1)) {
        classList.push(classPart)
      }
    })

    let hasBinding = false
    classList = classList.map((className) => {
      if (exp.isExpr(className)) {
        hasBinding = true
        return exp(className)
      }
      else {
        return `'${className}'`
      }
    })

    if (hasBinding) {
      const newAttr = {
        name: ':class',
        value: '[' + classList.join(', ') + ']'
      }
      attrs.splice(i, 1, newAttr)
    }
  }
}

/**
 * Rewrite `style`
 *
 * Weex:
 *  style="height: {{height}}; background-color: {{backgroundColor}};"
 * Vue:
 *  :style="{ height: height, backgroundColor: backgroundColor }"
 *
 * @param {Array} attrs
 * @param {Number} i
 */
function rewriteStyle (attrs, i) {
  const value = attrs[i].value.trim()
  const styleList = []

  if (value) {
    let hasBinding = false
    value.split(';').forEach((declaration) => {
      declaration = declaration.trim()
      const colonIndex = declaration.indexOf(':')
      if (colonIndex > -1) {
        let k = declaration.slice(0, colonIndex).trim()
        k = util.hyphenedToCamelCase(k)
        let v = declaration.slice(colonIndex + 1).trim()
        if (exp.isExpr(v)) {
          hasBinding = true
          v = exp(v)
        }
        else {
          v = `'${v}'`
        }
        styleList.push(`${k}: ${v}`)
      }
    })

    if (hasBinding) {
      const newAttr = {
        name: ':style',
        value: '{ ' + styleList.join('; ') + ' }'
      }
      attrs.splice(i, 1, newAttr)
    }
  }
}

/**
 * Rewrite `if`
 *
 * Weex:
 *  if="{{!rightItemSrc}}"
 * Vue:
 *  v-if="!rightItemSrc"
 *
 * @param {Array} attrs
 * @param {Number} i
 */
function rewriteIf (attrs, i) {
  const value = attrs[i].value.trim()
  const newAttr = {
    name: 'v-if',
    value: exp.isExpr(value) ? value.slice(2, -2) : value
  }
  attrs.splice(i, 1, newAttr)
}

/**
 * Rewrite `else`
 *
 * Weex:
 *  else
 * Vue:
 *  v-else
 *
 * @param {Array} attrs
 * @param {Number} i
 */
function rewriteElse (attrs, i) {
  const newAttr = {
    name: 'v-else',
    value: '' // FIXME: 转出来是v-else=""
  }
  attrs.splice(i, 1, newAttr)
}

/**
 * Rewrite `repeat`
 *
 * Weex:
 *  repeat="{{item in tabItems}}"
 * Vue:
 *  v-for="item in tabItems"
 *
 * @param {Array} attrs
 * @param {Number} i
 */
function rewriteRepeat (attrs, i) {
  let value = attrs[i].value.trim()
  if (exp.isExpr(value)) {
    value = value.slice(2, -2)
  }
  if (!value.match(/(.*) (?:in) (.*)/)) { // FIXME: 必须写key, value，先这么写
    value = `$value in ${value}`
  }
  const newAttr = {
    name: 'v-for',
    value
  }
  attrs.splice(i, 1, newAttr)
}

/**
 * Rewrite events
 *  TODO: `@click.native`, native event of custom compoents,
 *  need to analyze dependencies between componsnts
 *
 * Weex:
 *  onclick="onclickrightitem"
 * Vue:
 *  @click="onclickrightitem"
 *
 * @param {Array} attrs
 * @param {Number} i
 */
function rewriteEvent (attrs, i) {
  const value = attrs[i].value.trim()
  const name = attrs[i].name
  const newAttr = {
    name: '@' + name.slice(2),
    value: exp.isExpr(value) ? value.slice(2, -2) : value
  }
  attrs.splice(i, 1, newAttr)
}

/**
 * Rewrite attributes
 *
 * Weex:
 *  src="{{rightItemSrc}}"
 * Vue:
 *  :src="rightItemSrc"
 *
 * @param {Array} attrs
 * @param {Number} i
 */
function rewriteAttr (attrs, i) {
  const { name, value } = attrs[i]
  if (exp.isExpr(value)) {
    const newAttr = {
      name: `:${name}`,
      value: exp(value)
    }
    attrs.splice(i, 1, newAttr)
  }
}

module.exports = {
  rewriteContentTag,
  rewriteTextNode,
  rewriteId,
  rewriteClass,
  rewriteStyle,
  rewriteIf,
  rewriteElse,
  rewriteRepeat,
  rewriteEvent,
  rewriteAttr
}
