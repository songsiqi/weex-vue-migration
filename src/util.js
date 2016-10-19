/**
 * rules:
 * - abc-def -> abcDef
 * - -abc-def -> AbcDef
 *
 * @param  {string} value
 * @return {string}
 */
function hyphenedToCamelCase (value) {
  return value.replace(/-([a-z])/g, ($0, $1) => $1.toUpperCase())
}

/**
 * rules:
 * - abcDef -> abc-def
 * - AbcDef -> -abc-def
 *
 * @param  {string} value
 * @return {string}
 */
function camelCaseToHyphened (value) {
  return value.replace(/([A-Z])/g, ($0, $1) => '-' + $1.toLowerCase())
}

const specialTags = [
  'template',
  'style',
  'script',
  'element',
  'wx-element',
  'wa-element',
  'we-element',
  'content',
  'slot',
  'container',
  'div',
  'scroller',
  'list',
  'cell',
  'text',
  'image',
  'img',
  'input',
  'switch',
  'slider',
  'indicator',
  'video',
  'a',
  'web',
  'wxc-tabbar',
  'wxc-navpage'
]

/**
 * Get custom components
 *
 * @param  {Array} deps
 * @return {Array} customComponents
 */
function getCustomComponents (deps) {
  return deps.filter((dep) => specialTags.indexOf(dep) === -1)
}

module.exports = {
  hyphenedToCamelCase,
  camelCaseToHyphened,
  getCustomComponents
}
