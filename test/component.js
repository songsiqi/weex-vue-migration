const transformer = require('../')
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
  expect(transformer.transform(fixture)).eql(expected)
}

describe('component', () => {
  it('single component', () => {
    const fixture = readFile('./test/components/component.we')
    const expected = readFile('./test/components/component.vue')
    assertEqual(fixture, expected)
  })
})
