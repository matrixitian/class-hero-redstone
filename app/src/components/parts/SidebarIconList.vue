<template>
  <div>
    <ul>
      <li v-for="(pic, i) in pics"
      :key="i" @click="changeView(pic)">
          <img :src="getImgUrl(pic)">
          <div class="notificationCountContainer"
            v-if="pic == 'benachrichtigungen'">
            <div>
              <span class="notificationCount">0</span>
            </div>
          </div>
          <transition name="fade" mode="out-in">
            <div class="marginRight" v-if="checkView(pic)"
              :class="{pink: checkView(pic)}">
            </div>
          </transition>
      </li>
    </ul>
    <img id="logout" :src="getImgUrl('logout')"
    @click="changeView('logout')">
  </div>
</template>

<script>
import router from '@/router'
import config from '@/includes/js/config'
import axios from 'axios'
const log = console.log

export default {
  name: 'ListItem',
  props: ['user', 'pics'],
  data() {
    return {
      updateRunning: false,
      updateRequested: false
    }
  },
  created() {
    this.$store.subscribe(async(mutation, state) => {
      if (mutation.type === 'setUpdateRunning') {
        this.updateRunning = state.updateRunning
      }

      if (mutation.type === 'setUpdateRequested') {
        this.updateRequested = state.updateRequested
      }
    })
  },
  methods: {
    checkView(view) {
      const curView = this.$store.getters.getView

      if (curView === view) {
        return true
      } else {
        return false
      }
    },
    getImgUrl(pic) {
      return require(`@/assets/list/${pic}.svg`)
    },
    async changeView(pic) {
      if (this.updateRequested || this.updateRunning) {
        const info = {
          msg: 'Tab Wechsel oder Ausloggen ist während einer aktiven Aktualisierung nicht möglich!',
          type: 'info'
        }

        this.$store.commit('setInfo', info)
        throw new Error('Cannot switch tabs or log out while update in progress.')
      }

      if (pic === 'logout') {
        try {
          const data = {
            accountType: this.user.accountType
          }

          await axios.post(`${config.domain}/logout`, data)

          localStorage.removeItem('@token')
          localStorage.removeItem('user')

          router.push('/login')
        } catch (err) {
          log(err)
        }
      } else if (pic !== 'benachrichtigungen' && pic !== 'logout') {
        this.$store.commit('setView', pic)
      }
    }
  },
  mounted() {
    if (this.user.accountType === 'teacher') { 
      // this.$store.commit('setView', 'lehrerverwaltung')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/includes/scss/animations/Fade';
@import '@/includes/scss/centerX';
@import '@/includes/scss/centerY';
@import '@/includes/scss/centerXY';

img#logout {
  @include centerX;
  padding: 7px;
  bottom: 12px;
  height: 28px;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    color: #fafaff;
    background-color: rgba(255, 255, 255, 0.15);
  }
}

ul {
  @include centerXY;
}

li {
  padding: 4px;
  border-radius: 10px;
  position: relative;
  margin-top: 8px;
  height: 45px;
  width: 45px;
  color: rgba(255, 255, 255, 0.6);
  transition: .2s ease;
  cursor: pointer;
  &:hover {
    color: #fafaff;
    background-color: rgba(255, 255, 255, 0.15);
  }
  img {
    @include centerXY;
    margin-bottom: 10px;
    height: 35px;
  }
}

div.notificationCountContainer {
  @include centerY;
  top: 40px;
  right: 0;
  padding: 5px;
  width: 10px;
  height: 10px;
  background-color: orangered;
  border-radius: 5px;
  box-shadow: 1px 1px 2px 1px rgba(0, 0, 0, 0.2);
  div {
    position: relative;
    width: 100%;
    height: 100%;
    span.notificationCount {
      color: white;
      @include centerXY;
      font-weight: bold;
      font-size: 14px;
    }
  }
}

div.marginRight {
  @include centerY;
  right: -9px;
  height: 40px;
  width: 3px;
}
.pink {
  background-color: hotpink;
}

</style>
