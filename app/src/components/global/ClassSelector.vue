<template>
  <ul>
    <li v-for="(_class, i) in classes" :key="i"
    @click="emitSelectedClass(_class)">
      <span>{{ _class }}</span>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'ClassSelector',
  props: ['classes'],
  methods: {
    emitSelectedClass(val) {
      this.$emit('classSelected', val);
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/includes/scss/centerXY';



</style>