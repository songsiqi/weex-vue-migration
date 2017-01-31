const parse5 = require('parse5')
const rewriter = require('./rewriter')

/**
 * Rewrite `<template>`
 *
 * @param {Node|String} node
 * @param {Array} deps
 * @return {String} templateContent
 */
function rewrite (node, deps = []) {
  if (typeof node === 'string') {
    const options = {
      treeAdapter: parse5.treeAdapters.default,
      locationInfo: true
    }
    node = parse5.parseFragment(node, options)
  }

  const { nodeName } = node

  if (nodeName[0] !== '#' && deps.indexOf(nodeName) === -1) {
    deps.push(nodeName)
  }

  switch (nodeName) {
    case 'content':
      rewriter.rewriteContentTag(node)
      break
    case 'img':
      rewriter.rewriteImgTag(node)
      break
    case 'text':
      rewriter.rewriteTextNode(node)
      break
    default:
      break
  }

  const attrs = node.attrs || []
  attrs.forEach((attr, i) => {
    const { name } = attr
    switch (name) {
      case 'id':
        rewriter.rewriteId(attrs, i)
        break
      case 'class':
        rewriter.rewriteClass(attrs, i)
        break
      case 'style':
        rewriter.rewriteStyle(attrs, i)
        break
      case 'if':
        rewriter.rewriteIf(attrs, i)
        break
      case 'else':
        rewriter.rewriteElse(attrs, i)
        break
      case 'repeat':
        rewriter.rewriteRepeat(attrs, i)
        break
      default:
        if (name.match(/^on/)) {
          rewriter.rewriteEvent(nodeName, attrs, i)
        }
        else {
          rewriter.rewriteAttr(attrs, i)
        }
        break
    }
  })

  const childNodes = node.childNodes || []
  childNodes.forEach((child) => {
    rewrite(child, deps)
  })

  let templateContent = parse5.serialize(node)
  // FIXME: do not escape `&&`` in template
  templateContent = templateContent.replace(/&amp;/g, '&')
  return templateContent
}

exports.rewrite = rewrite
