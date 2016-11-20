const Path = require('path')

/**
 * rules:
 * - abc-def -> abcDef
 * - -abc-def -> AbcDef
 *
 * @param {string} value
 * @return {string}
 */
function hyphenedToCamelCase (value) {
  return value.replace(/-([a-z])/g, ($0, $1) => $1.toUpperCase())
}

const builtinTags = [
  'a',
  'cell',
  'container',
  'content',
  'div',
  'element',
  'embed',
  'hlist',
  'image',
  'img',
  'indicator',
  'input',
  'list',
  'loading',
  'loading-indicator',
  'refresh',
  'script',
  'scroller',
  'slider',
  'slider-neighbor',
  'slot',
  'style',
  'switch',
  'template',
  'text',
  'video',
  'wa-element',
  'we-element',
  'web',
  'wx-element'
]

// see: https://github.com/weexteam/weex-components/tree/master/src
const wxcTags = [
  'wxc-button',
  'wxc-countdown',
  'wxc-hn',
  'wxc-list-item',
  'wxc-marquee',
  'wxc-navbar',
  'wxc-navpage',
  'wxc-panel',
  'wxc-tabbar',
  'wxc-tabitem',
  'wxc-tip'
]

const builtinEvents = [
  'appear',
  'blur',
  'change',
  'click',
  'disappear',
  'focus',
  'input'
]

/**
 * Format deps to requires: implicit deps and weex components
 *
 * @param {Array} deps
 * @return {Array} customComponents
 */
function formatDepsToRequires (deps) {
  return deps
    .filter((dep) => builtinTags.indexOf(dep) === -1)
    .map((dep) => {
      return wxcTags.indexOf(dep) > -1 ?
        `weex-vue-components/${dep}.vue` :
        `./${dep}.vue`
    })
}

/**
 * Remove duplicated requires
 *  Input:  ['./a.vue', './b.vue'],
 *          ['./path/to/b.vue', './path/to/c.vue']
 *  Output: ['./a.vue', './path/to/b.vue', './path/to/c.vue']
 *
 * @param {Array} requires
 * @param {Array} requiresInScript
 */
function removeDuplicatedRequires (requires, requiresInScript) {
  for (let i = 0; i < requires.length; i++) {
    const basename1 = Path.basename(requires[i])
    requiresInScript.forEach((dep) => {
      const basename2 = Path.basename(dep)
      if (basename1 === basename2) {
        requires.splice(i, 1)
        i--
      }
    })
  }
  Array.prototype.push.apply(requires, requiresInScript)
}

/**
 * Whether to add `.native` modifier to `v-on`,
 * while listening for built-in events on custom components
 *
 * @param {String} tagName
 * @param {String} eventName
 * @return {Boolean}
 */
function shouldAppendNativeModifier (tagName, eventName) {
  return builtinTags.indexOf(tagName) === -1 &&
    builtinEvents.indexOf(eventName) > -1
}

module.exports = {
  hyphenedToCamelCase,
  formatDepsToRequires,
  removeDuplicatedRequires,
  shouldAppendNativeModifier
}
