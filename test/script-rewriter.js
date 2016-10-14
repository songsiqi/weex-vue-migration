const scriptRewriter = require('../lib/script-rewriter')
const chai = require('chai')
const expect = chai.expect

function assertEqual (fixture, expected) {
  const result = scriptRewriter.rewrite(fixture)
  expect(result).eql(expected)
}

describe('template', () => {
  it('rewrite `data` to `props` in `module.exports`', () => {
    const fixture1 = `
module.exports = {
  data: {
    level: 1,
    itemList: [{ id: '520421163634', title: 'title 1' }, { id: '522076777462', title: 'title 2' }]
  }
};`
    const fixture2 = `
module.exports = {
  data: function () {
    return {
      level: 1,
      itemList: [{ id: '520421163634', title: 'title 1' }, { id: '522076777462', title: 'title 2' }]
    }
  }
};`
    const fixture3 = `
module.exports = {
  data() {
    return {
      level: 1,
      itemList: [{ id: '520421163634', title: 'title 1' }, { id: '522076777462', title: 'title 2' }]
    }
  }
};`
    const expected = `
module.exports = {
  props: {
    level: {
      default: 1
    },
    itemList: {
      default: [{ id: '520421163634', title: 'title 1' }, { id: '522076777462', title: 'title 2' }]
    }
  }
};`
    assertEqual(fixture1, expected)
    assertEqual(fixture2, expected)
    assertEqual(fixture3, expected)
  })

  it('rewrite `data` to `props` in `export default`', () => {
    const fixture1 = `
export default {
  data: {
    level: 1,
    itemList: [{ id: '520421163634', title: 'title 1' }, { id: '522076777462', title: 'title 2' }]
  }
};`
    const fixture2 = `
export default {
  data: function () {
    return {
      level: 1,
      itemList: [{ id: '520421163634', title: 'title 1' }, { id: '522076777462', title: 'title 2' }]
    }
  }
};`
    const fixture3 = `
export default {
  data() {
    return {
      level: 1,
      itemList: [{ id: '520421163634', title: 'title 1' }, { id: '522076777462', title: 'title 2' }]
    }
  }
};`
    const expected = `
export default {
  props: {
    level: {
      default: 1
    },
    itemList: {
      default: [{ id: '520421163634', title: 'title 1' }, { id: '522076777462', title: 'title 2' }]
    }
  }
};`
    assertEqual(fixture1, expected)
    assertEqual(fixture2, expected)
    assertEqual(fixture3, expected)
  })

  it('rewrite `$el` to `$refs`', () => {
    const fixture = `const a = self.$el('xxx');`
    const expected = `const a = self.$refs['xxx'];`
    assertEqual(fixture, expected)
  })
})
