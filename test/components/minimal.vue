<template>
  <div>
    <top-banner></top-banner>
    <wxc-button></wxc-button>
  </div>
</template>

<script>

module.exports = {
  components: {
    topBanner: require('./top-banner.vue'),
    wxcButton: require('weex-vue-components/button.vue')
  }
};</script>
