const expParser = require('./parsers/expression')
const textParser = require('./parsers/text')

/**
 * Transfer expressions
 *
 * @param {String} expContent
 * @return {String} ret
 */
function transExpr (expContent) {
  let ret
  expContent = expContent.trim()
  if (!textParser.isExpr(expContent)) {
    ret = expContent
  }
  else {
    ret = []
    const tokens = textParser.parseText(expContent)
    tokens.forEach((token) => {
      if (token.tag) {
        let res = expParser.parseExpression(token.value)
        if (tokens.length > 1) {
          res = `(${res})`
        }
        ret.push(res)
      }
      else {
        ret.push(`'${token.value}'`)
      }
    })
    ret = ret.join(' + ')
  }
  return ret
}

transExpr.isExpr = textParser.isExpr

module.exports = transExpr
