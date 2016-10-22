# weex-vue-migration

Migration from *.we file to *.vue file.

任务：

* https://github.com/weexteam/weex-vue-framework/issues/9
* https://github.com/weexteam/weex-vue-framework/issues/4

babel插件编写：

* http://babeljs.io/docs/usage/api/
* https://github.com/babel/babel/tree/master/packages/babel-types
* https://github.com/thejameskyle/babel-handbook/blob/master/translations/zh-Hans/README.md

## TODO

1、
Weex:
this.$el('xxx')
Vue:
this.$refs.xxx
this.$refs['xxx']
几种特殊情况：
const $el = this.$el
$el('xxx')
const $ = this.$el
const self = this

2、
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
data是function，return之前有其他语句的情况

3、
Weex:
<list-item></list-item>
require('weex-components/list-item.we')
Vue:
components: {
  listItem: require('weex-vue-components/list-item.vue')
}
require、import语句必须在最前

4、
Weex:
<script type="data"></script>
<script type="config"></script>
Vue:
data 转成 root 组件的 data option，config 在 vue 里暂时没有实际意义，可以忽略先

5、
Weex:
<element name="xx"></element>
Vue:
Vue.component({xx: { ... }})
module.exports和export default之前有其他语句的情况

6、
Weex:
$dispatch()/$broadcast()
Vue: // 不能完全等价迁移，部分场景需要手工调整
$emit()
