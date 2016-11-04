const scriptRewriter = require('../lib/script-rewriter')
const chai = require('chai')
const expect = chai.expect

function assertEqual (fixture, expected, data, deps, elementList) {
  const result = scriptRewriter.rewrite(fixture, { data, deps, elementList })
  expect(result.code).eql(expected)
}

describe('script', () => {
  it('rewrite `$el` to `$refs`', () => {
    const fixture1 = `const a = this.$el('xxx');`
    const expected1 = `const a = this.$refs['xxx'];`
    assertEqual(fixture1, expected1)

    const fixture2 = `const a = self.$el('xxx');`
    const expected2 = `const a = self.$refs['xxx'];`
    assertEqual(fixture2, expected2)
  })

  it('rewrite `$dispatch` and `$broadcast` to `$emit`', () => {
    const fixture1 = `this.$dispatch('xxx', data);`
    const fixture2 = `this.$broadcast('xxx', data);`
    const expected1 = `this.$emit('xxx', data);`
    assertEqual(fixture1, expected1)
    assertEqual(fixture2, expected1)

    const fixture3 = `self.$dispatch('xxx');`
    const fixture4 = `self.$broadcast('xxx');`
    const expected2 = `self.$emit('xxx');`
    assertEqual(fixture3, expected2)
    assertEqual(fixture4, expected2)
  })

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
      default: function () {
        return [{ id: '520421163634', title: 'title 1' }, { id: '522076777462', title: 'title 2' }];
      }
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
      default: function () {
        return [{ id: '520421163634', title: 'title 1' }, { id: '522076777462', title: 'title 2' }];
      }
    }
  }
};`
    assertEqual(fixture1, expected)
    assertEqual(fixture2, expected)
    assertEqual(fixture3, expected)
  })

  it('rewrite `<script type="data">` to `data`', () => {
    const fixture = `
module.exports = {
  data() {
    return {
      dataInData: 1
    }
  }
};`
    const data = '{ a: 1, b: { c: 1 } }'
    const expected = `
module.exports = {
  data: function () {
    return {
      a: 1,
      b: {
        c: 1
      }
    };
  },

  props: {
    dataInData: {
      default: 1
    }
  }
};`
    assertEqual(fixture, expected, data)
  })

  it('rewrite `require`, `import` and implicit deps to `components`', () => {
    const fixture = `
var a = 'xxx';
var itemA = require('path/to/item-a.we');
require('path/to/item-b.we');
import 'weex-components';
import itemC from 'path/to/item-c.we';
import 'path/to/item-d.we';
import { throttle } from './util.js';
module.exports = {
  methods: {}
};`
    const deps = ['top-banner', 'bottom-banner', 'wxc-button']
    const expected = `
var a = 'xxx';

import { throttle } from './util.js';
module.exports = {
  components: {
    topBanner: require('./top-banner.vue'),
    bottomBanner: require('./bottom-banner.vue'),
    wxcButton: require('weex-vue-components/button.vue'),
    itemA: require('path/to/item-a.vue'),
    itemB: require('path/to/item-b.vue'),
    itemC: require('path/to/item-c.vue'),
    itemD: require('path/to/item-d.vue')
  },

  methods: {}
};`
    assertEqual(fixture, expected, null, deps)
  })
})
