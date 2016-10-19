const templateRewriter = require('../lib/template-rewriter')
const parse5 = require('parse5')
const chai = require('chai')
const expect = chai.expect

function assertDomString (fixture, expected) {
  const node = templateRewriter.rewrite(fixture, [])
  expect(parse5.serialize(node)).eql(expected)
}

describe('template', () => {
  it('rewrite `content` tag', () => {
    const fixture = '<content></content>'
    const expected = '<slot></slot>'
    assertDomString(fixture, expected)
  })

  it('rewrite text node', () => {
    const fixture = `
        <text>
          {{title}}
        </text>`
    const expected = `
        <text>{{title}}</text>`
    assertDomString(fixture, expected)
  })

  it('rewrite id', () => {
    const fixture = `
        <div>
          <div id="a"></div>
          <div id="{{b}}"></div>
        </div>`
    const expected = `
        <div>
          <div ref="a"></div>
          <div :ref="b"></div>
        </div>`
    assertDomString(fixture, expected)
  })

  it('rewrite class', () => {
    const fixture = `
        <div>
          <div class="a b c"></div>
          <div class="a b{{b}} c"></div>
          <div class=" b{{b ? 'd' : 'f' }} a {{c + d}}"></div>
        </div>`
    const expected = `
        <div>
          <div class="a b c"></div>
          <div :class="['a', 'b' + (b), 'c']"></div>
          <div :class="['b' + (b?'d':'f'), 'a', c+d]"></div>
        </div>`
    assertDomString(fixture, expected)
  })

  it('rewrite style', () => {
    const fixture = `
        <div>
          <div style="color: #f00; background-color: rgba(0, 0, 0, 0.7);"></div>
          <div style="background-color: red; height: {{height}}; color: {{active?'#f00':'#0f0'}};"></div>
        </div>`
    const expected = `
        <div>
          <div style="color: #f00; background-color: rgba(0, 0, 0, 0.7);"></div>
          <div :style="{ backgroundColor: 'red'; height: height; color: active?'#f00':'#0f0' }"></div>
        </div>`
    assertDomString(fixture, expected)
  })

  it('rewrite if & else', () => {
    const fixture = `
        <div>
          <div if="{{!exp1}}"></div>
          <div if="exp2"></div>
          <div else></div>
        </div>`
    const expected = `
        <div>
          <div v-if="!exp1"></div>
          <div v-if="exp2"></div>
          <div v-else=""></div>
        </div>`
    assertDomString(fixture, expected)
  })

  it('rewrite repeat', () => {
    const fixture = `
        <div>
          <div repeat="items"></div>
          <div repeat="item in items"></div>
          <div repeat="{{item in items}}"></div>
          <div repeat="(key, val) in items"></div>
        </div>`
    const expected = `
        <div>
          <div v-for="$value in items"></div>
          <div v-for="item in items"></div>
          <div v-for="item in items"></div>
          <div v-for="(val, key) in items"></div>
        </div>`
    assertDomString(fixture, expected)
  })

  it('rewrite event', () => {
    const fixture = `
        <div>
          <div onclick="onclickleftitem"></div>
          <div onclick="onclickrightitem(item, $event)"></div>
          <list-item onclick="onclickitem(item, $event)" ondelete="ondeleteitem(item, $event)"></list-item>
        </div>`
    const expected = `
        <div>
          <div @click="onclickleftitem"></div>
          <div @click="onclickrightitem(item, $event)"></div>
          <list-item @click.native="onclickitem(item, $event)" @delete="ondeleteitem(item, $event)"></list-item>
        </div>`
    assertDomString(fixture, expected)
  })

  it('rewrite attr', () => {
    const fixture = `
        <div>
          <img src="{{imgSrc}}">
          <text value="aa"></text>
          <text value="a{{b[c.d][0] ? 'a' : 'b'}} c"></text>
        </div>`
    const expected = `
        <div>
          <img :src="imgSrc">
          <text value="aa"></text>
          <text :value="'a' + (b[c.d][0]?'a':'b') + ' c'"></text>
        </div>`
    assertDomString(fixture, expected)
  })
})
