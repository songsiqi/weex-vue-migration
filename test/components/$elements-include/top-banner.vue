
  <template>
    <div class="banner">
      <img :src="src">
    </div>
  </template>
  <style scoped="">
    .banner { width: 100; height: 100; }
  </style>
  <script>
module.exports = {
  props: {
    src: {
      default: '//gw.alicdn.com/imgextra/i1/2927210366/TB22qwdXhaK.eBjSZFwXXXjsFXa-2927210366.jpg'
    }
  }
};</script>
