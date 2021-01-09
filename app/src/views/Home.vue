<template>
  <div class="home" v-if="user">
    <Sidebar id="Sidebar" />
    <Inner id="Inner" />
    <UpdateInfo id="UpdateInfo" :class="{UpdateInfoShown: updateInfoMsg === null}" />
  </div>
</template>

<script>
import config from '@/includes/js/config'
import router from '@/router'
import axios from 'axios'
// Components
import Sidebar from '@/components/Sidebar'
import Inner from '@/components/Inner'
import UpdateInfo from '@/components/UpdateInfo'
// Functions
import func from '@/includes/js/functions'
const log = console.log

export default {
  name: 'Home',
  components: {
    Sidebar, Inner, UpdateInfo
  },
  data() {
    return {
      user: null,
      updateInfoMsg: null,
      updateRequested: false
    }
  },
  async created() {
    document.title = "ClassHero Web"

    const user = func.getUser()

    if (!user) router.push('/login')
    else {
      this.user = user
      const authToken = localStorage.getItem('@token')
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
      axios.defaults.headers.common['Account-Type'] = `AccountTypeBearer ${this.user.accountType}`
    }

    // Check if App is up to date (pinging)!
    const appUpToDate = await axios.post(`${config.domain}/check-last-save-time`, {LSTime: localStorage.getItem('lastSaveTime')})
    this.$store.commit('setAppUpToDateState', appUpToDate)

    this.$store.subscribe(async(mutation, state) => {
      if (mutation.type === 'setUpdateInfoMsg') {
        this.updateInfoMsg = state.updateInfoMsg
      }

      if (mutation.type === 'setUpdateRequested') {
        this.updateRequested = state.updateRequested
      }
    })
  }
}
</script>

<style lang="scss" scoped>
$sidebarWidth: 70px;
$footerHeight: 60px;

#Sidebar {
  position: absolute;
  top: 0; left: 0;
  height: 100%; width: $sidebarWidth;
  background-color: #0a133f;
  // box-shadow: 5px 5px 6px 5px rgba(255, 255, 255, 0.6);
  border-right: 1px solid rgb(212, 212, 212);
}

#Inner {
  position: absolute;
  top: 0; right: 0;
  width: calc(100vw - #{$sidebarWidth});
  height: 100vh;
  background-color: #0d1e36;
}

#UpdateInfo {
  position: absolute;
  bottom: 0; right: 0;
  width: calc(100vw - #{$sidebarWidth});
  height: $footerHeight;
  background-color: transparent !important;
}

.UpdateInfoShown {
  background-color: transparent !important;
}
</style>