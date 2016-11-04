# weex-vue-migration

Migration from *.we file to *.vue file.

## Install

```bash
npm install weex-vue-migration
```

## Usage

### CLI tool

```
  Usage: weex-vue-migrate [options] <file...>

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -o, --output [path]      the output file dirname
```

### API

#### `transform(weexCode)`

```javascript
var migrater = require('weex-vue-migration')
var vueCode = migrater.transform(weexCode)
```

params:

* `weexCode`: string, weex DSL code

returns:

* `vueCode`: string, vue DSL code

## License

GPL-3.0

## References

Mission:

* https://github.com/weexteam/weex-vue-framework/issues/9
* https://github.com/weexteam/weex-vue-framework/issues/4

Babel plugins:

* http://babeljs.io/docs/usage/api/
* https://github.com/babel/babel/tree/master/packages/babel-types
* https://github.com/thejameskyle/babel-handbook/blob/master/translations/zh-Hans/README.md

## TODO

* Rewrite `$el` to `$refs`

```
// Weex:
this.$el('xxx')

// Vue:
this.$refs.xxx
this.$refs['xxx']

// Some special cases:
const $el = this.$el
$el('xxx')
const $ = this.$el
const self = this
```

* Rewrite `data` to `props`

```
// Weex:
data: {
  num: 1,
  obj: { a: 1 }
}

// Vue:
props: {
  num: { default: 1 },
  obj: {
    default: function () {
      return { a: 1 }
    }
  }
}

// Special case:
These exist other statements before `return` of `data: function () { return { ... } }` or `data() { return { ... } }`.
```

* Rewrite `require` and `import`

```
// Weex:
require('weex-components')
require('weex-components/wxc-button.we')
import 'weex-components/wxc-countdown.we'

// Vue:
components: {
  wxcButton: require('weex-vue-components/button.vue'),
  wxcCountdown: require('weex-vue-components/countdown.vue')
}

// Special case:
Some `require` or `import` statements locate after `module.exports` or `export default`.
```

* Rewrite `<script>` whose type is `data` and `config`

```
// Weex:
<script type="data"></script>
<script type="config"></script>

// Vue:
data: {}

// TODO:
Only transform `data` of the root component, and `config` is now ignored.
```

* Rewrite `<element>`

```
// Weex:
<element name="xx"></element>

// Vue:
components: {
  xx: { ... }
}

// Special case:
There exist some statements before `module.exports` or `export default`.
```

* Rewrite `$dispatch` and `$broadcast`

```
// Weex:
$dispatch()
$broadcast()

// Vue:
$emit()

// TODO:
This is not fully equivalent, so still have to hand-tune the code.
```
