<template>
  <div>
    <section id="Main">

    </section>
  </div>
</template>

<script>
import axios from 'axios'
import config from '@/includes/js/config'
const log = console.log

export default {
  name: '',
  data() {
    return {

    }
  },
  methods: {

  },
  async created() {
    const data = {
      
    }
    const res = await axios.post(`${config.domain}/name`, data)
  }
}
</script>

<style lang="scss" scoped>
@import '@/includes/scss/centerXY';



</style>