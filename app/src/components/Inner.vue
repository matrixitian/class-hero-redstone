<template>
  <div id="main">
    <!-- <keep-alive> -->
      <component :is="view" id="component"></component>
    <!-- </keep-alive> -->
  </div>
</template>

<script>
import capitalizeString from '@/includes/js/capitalizeString'
import * as components from '@/components/inside_inner'
import func from '@/includes/js/functions'
const log = console.log

export default {
  name: 'Inner',
  components: {
    ...components
  },
  data() {
    return {
      view: null,
      notificationsActive: false
    }
  },
  created() {
    const user = func.getUser()

    // Default Inner Component to Show
    if (user.accountType == 'planer') this.view = 'Stundenplan'
    if (user.accountType == 'teacher') this.view = 'Klassenstundenplaene'

    this.$store.subscribe(async(mutation, state) => {
      if (mutation.type === 'setView') {
        let view
        if (state.view === 'benachrichtigungen') {
          this.notificationsActive = true
        } else {
          view = await capitalizeString(state.view)
          this.setView(view)
        }
      }
    })
  },
  methods: {
    setView(view) {
      this.view = capitalizeString(view)
    },
    checkView(view) {
      const curView = this.$store.getters.getView

      if (curView === view) {
        return true
      } else {
        return false
      }
    }
  }
}
</script>

<style lang="scss" scoped>

#component {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

</style>
