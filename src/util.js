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

module.exports = {
  hyphenedToCamelCase,
  camelCaseToHyphened
}
