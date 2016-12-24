# weex-vue-migration

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Downloads][downloads-image]][downloads-url]

[npm-image]: https://img.shields.io/npm/v/weex-vue-migration.svg?style=flat-square
[npm-url]: https://npmjs.org/package/weex-vue-migration
[travis-image]: https://img.shields.io/travis/songsiqi/weex-vue-migration.svg?style=flat-square
[travis-url]: https://travis-ci.org/songsiqi/weex-vue-migration
[coveralls-image]: https://img.shields.io/coveralls/songsiqi/weex-vue-migration.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/songsiqi/weex-vue-migration
[downloads-image]: http://img.shields.io/npm/dm/weex-vue-migration.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/weex-vue-migration

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
    -e, --entry [path]       entry files, separated by comma `,`
    -o, --output [path]      output file dirname
```

### API

#### `transform(weexCode, isEntry)`

```javascript
var migrater = require('weex-vue-migration')
var result = migrater.transform(weexCode)
```

params:

* `weexCode`: string, weex DSL code

returns:

* `result`: object, result
  * `content`: string, vue DSL code
  * `elements`: array, list of elements object
    * `name`: string, name of `<element>`
    * `content`: string, vue DSL code of `<element>`

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
