
  <template>
    <div class="banner">
      <image :src="src"></image>
    </div>
  </template>
  <style scoped="">
    .banner { width: 100; height: 100; }
  </style>
  <script>
export default {
  props: {
    src: {
      default: '//gw.alicdn.com/imgextra/i1/2927210366/TB22qwdXhaK.eBjSZFwXXXjsFXa-2927210366.jpg'
    }
  }
};</script>
