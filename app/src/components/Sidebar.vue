<template>
  <div>
    <img id="logo" src="@/assets/logos/logo.svg">
    <SidebarIconList id="List" v-if="user"
    :user="user" 
    :pics="iconList"/>
  </div>
</template>

<script>
import router from '@/router'
// Components
import SidebarIconList from '@/components/parts/SidebarIconList'
// Functions
import func from '@/includes/js/functions'
const log = console.log

export default {
  name: 'Sidebar',
  components: { SidebarIconList },
  data() {
    return {
      connected: true,
      user: null,
      icons: {
        planer: ['lehrerverwaltung', 
        'klassenverwaltung', 'raumverwaltung', 'stundendauer'],
        teacher: ['benachrichtigungen', 'klassenstundenplaene', 'lehrerstundenplan',
        'dynoklassenstundenplaene']
      }
    }
  },
  computed: {
    iconList() {
      if (this.user.accountType === 'planer') {
        return this.icons.planer
      } else if (this.user.accountType === 'teacher') {
        return this.icons.teacher
      }
    }
  },
  created() {
    setInterval(() => {
      this.connected = navigator.onLine
    }, 1000)
    
    this.user = func.getUser()
  }
}
</script>

<style lang="scss" scoped>
@import '@/includes/scss/centerX';
@import '@/includes/scss/centerXY';

img#logo {
  @include centerX;
  top: 10px;
  height: 46px;
  margin-right: 10px;
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}

#List {
  @include centerXY;
  width: 100%;
  height: 100%;
  border-right: 1px solid rgb(212, 212, 212);
}

</style>
