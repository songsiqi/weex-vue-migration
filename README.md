# weex-vue-migration

Migration from *.we file to *.vue file.

https://github.com/weexteam/weex-vue-framework/issues/9

https://github.com/weexteam/weex-vue-framework/issues/4

babel插件编写：

* http://babeljs.io/docs/usage/api/
* https://github.com/thejameskyle/babel-handbook/blob/master/translations/zh-Hans/README.md

## TODO

1、
Weex:
onclick="xxx"
Vue: // 自定义组件的原生事件
@click.native="xxx"
这个可能需要分析组件依赖关系。如果找不到同名组件依赖，就是原生组件，否则就是自定义组件

2、
Weex:
this.$el('xxx')
Vue:
this.$refs.xxx
this.$refs['xxx']
的几种特殊情况：
const $el = this.$el
$el('xxx')
const $ = this.$el
const self = this

3、
Weex:
data: {
  level: 1,
  value: ''
}
Vue:
props: {
  level: { default: 1 },
  value: { default: '' }
}
data是function的情况，return之前有其他语句

4、
Weex:
require('weex-components')
标签deps隐式依赖
Vue: // 通过 components 字段显性定义
components: {
  item: require('weex-vue-components/list-item.vue'),
  button: require('weex-vue-components/button.vue'),
  countdown: require('weex-vue-components/countdown.vue'),
  hn: require('weex-vue-components/hn.vue')
}

5、
Weex:
$dispatch()/$broadcast()
Vue: // 不能完全等价迁移，部分场景需要手工调整
$emit()

6、
Weex:
<script type="data"></script>
<script type="config"></script>
Vue:
data 有机会转成 root 组件的 data option，config 在 vue 里暂时没有实际意义，可以忽略先

7、
Weex:
<element></element>
Vue:
转换成新的.vue文件？
Vue.component()

8、所有js代码的ES6代码转换问题
