const webpack = require('webpack')
const weex = require('weex-js-framework')
const { Runtime, Instance } = require('weex-vdom-tester')
const webpackConfig = require('../build/webpack.config')
const migrater = require('../')
const fs = require('fs')
const chai = require('chai')
const expect = chai.expect

function readFile (filepath) {
  if (fs.existsSync(filepath)) {
    return fs.readFileSync(filepath, { encoding: 'utf-8' }) || ''
  }
  return ''
}

function assertEqual (fixture, expected) {
  const result = migrater.transform(fixture)
  expect(result).eql(expected)
}

const testDir = './test/components'
const runtime = new Runtime(weex)

console.debug = function () {}

function runWeexTest (name, end) {
  webpackConfig.entry = `${testDir}/vue/${name}.vue`
  webpackConfig.output.filename = `${testDir}/bundle/${name}.js`

  webpack(webpackConfig, (err, stats) => {
    expect(err).to.not.be.ok
    if (!err) {
      const app = new Instance(runtime)
      const code = readFile(webpackConfig.output.filename)
      expect(() => {
        app.$create(code)
        // TODO: check app.getRealRoot()
        app.$destroy()
      }).to.not.throw()
    }
    end()
  })
}

describe('component', () => {
  it('single component', function (end) {
    this.timeout(5000)
    const fixture = readFile(`${testDir}/weex/single.we`)
    const expected = readFile(`${testDir}/vue/single.vue`)
    assertEqual(fixture, expected)
    // runWeexTest('single', end)
    end()
  })

  it('component with element', function (end) {
    this.timeout(5000)
    const fixture = readFile(`${testDir}/weex/element.we`)
    const expected = readFile(`${testDir}/vue/element.vue`)
    assertEqual(fixture, expected)
    // runWeexTest('element', end)
    end()
  })

  it('minimal component', function (end) {
    this.timeout(5000)
    const fixture = readFile(`${testDir}/weex/minimal.we`)
    const expected = readFile(`${testDir}/vue/minimal.vue`)
    assertEqual(fixture, expected)
    // runWeexTest('minimal', end)
    end()
  })

  it('minimal component with minimal element', function (end) {
    this.timeout(5000)
    const fixture = readFile(`${testDir}/weex/minimal-element.we`)
    const expected = readFile(`${testDir}/vue/minimal-element.vue`)
    assertEqual(fixture, expected)
    runWeexTest('minimal-element', end)
  })
})
