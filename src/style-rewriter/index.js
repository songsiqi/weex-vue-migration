/**
 * Rewrite `<style>`
 *
 * @param {Node} node
 */
function rewrite (node) {
  // add `scoped` to `<style>`
  node.attrs.push({
    name: 'scoped',
    value: ''
  })
}

exports.rewrite = rewrite
