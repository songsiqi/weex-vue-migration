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

describe('component', () => {
  it('single component', () => {
    const fixture = readFile(`${testDir}/single.we`)
    const expected = readFile(`${testDir}/single.vue`)
    assertEqual(fixture, expected)
  })

  it('component with element', () => {
    const fixture = readFile(`${testDir}/element.we`)
    const expected = readFile(`${testDir}/element.vue`)
    assertEqual(fixture, expected)
  })

  it('minimal component with minimal element', () => {
    const fixture = readFile(`${testDir}/minimal.we`)
    const expected = readFile(`${testDir}/minimal.vue`)
    assertEqual(fixture, expected)
  })
})
