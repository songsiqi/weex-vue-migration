const migrator = require('../')
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
  const result = migrator.transform(fixture)
  expect(result).eql(expected)
}

const TEST_PATH = './test/components'
const ELEMENT_PATH = migrator.ELEMENT_PATH

describe('component', () => {
  it('single component', () => {
    const fixture = readFile(`${TEST_PATH}/single.we`)
    const expected = {
      content: readFile(`${TEST_PATH}/single.vue`),
      elements: []
    }
    assertEqual(fixture, expected)
  })

  it('component with element', () => {
    const fixture = readFile(`${TEST_PATH}/element.we`)
    const expected = {
      content: readFile(`${TEST_PATH}/element.vue`),
      elements: [
        {
          name: 'top-banner',
          content: readFile(`${TEST_PATH}/${ELEMENT_PATH}/top-banner.vue`)
        },
        {
          name: 'bottom-banner',
          content: readFile(`${TEST_PATH}/${ELEMENT_PATH}/bottom-banner.vue`)
        }
      ]
    }
    assertEqual(fixture, expected)
  })

  it('minimal component', () => {
    const fixture = readFile(`${TEST_PATH}/minimal.we`)
    const expected = {
      content: readFile(`${TEST_PATH}/minimal.vue`),
      elements: []
    }
    assertEqual(fixture, expected)
  })

  it('minimal component with minimal element', () => {
    const fixture = readFile(`${TEST_PATH}/minimal-element.we`)
    const expected = {
      content: readFile(`${TEST_PATH}/minimal-element.vue`),
      elements: [
        {
          name: 'middle-banner',
          content: readFile(`${TEST_PATH}/${ELEMENT_PATH}/middle-banner.vue`)
        }
      ]
    }
    assertEqual(fixture, expected)
  })
})
