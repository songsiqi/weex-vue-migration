<template>
  <div>
    <top-banner></top-banner>
    <div>
      <text>{{title}}</text>
    </div>
    <div v-for="item in itemList" @click="gotoDetail(item.itemId, $event)">
      <img class="thumb" :src="item.pictureUrl">
      <text class="title">{{item.title}}</text>
    </div>
    <wxc-button></wxc-button>
    <bottom-banner></bottom-banner>
  </div>
</template>

<style scoped="">
  .thumb {width: 200; height: 200;}
  .title {flex: 1; color: #ff0000; font-size: 48; font-weight: bold; background-color: #eeeeee;}
</style>



<script>
var dom = weex.requireModule('dom');
module.exports = {
  components: {
    topBanner: require('./top-banner.vue'),
    wxcButton: require('weex-vue-components/button.vue'),
    bottomBanner: require('./components/bottom-banner.vue')
  },
  data: function () {
    return {
      "title": "宝贝列表"
    };
  },

  props: {
    itemList: {
      default: function () {
        return [{ itemId: '520421163634', title: '宝贝标题1', pictureUrl: '//gd2.alicdn.com/bao/uploaded/i2/T14H1LFwBcXXXXXXXX_!!0-item_pic.jpg' }, { itemId: '522076777462', title: '宝贝标题2', pictureUrl: '//gd1.alicdn.com/bao/uploaded/i1/TB1PXJCJFXXXXciXFXXXXXXXXXX_!!0-item_pic.jpg' }];
      }
    }
  },
  methods: {
    gotoDetail: function (itemId, $event) {
      if (itemId && $event) {
        this.$openURL('https://item.taobao.com/item.htm?id=' + itemId);
      }
    }
  }
};</script>


