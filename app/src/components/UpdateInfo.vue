<template>
  <div id="Main">
    <button v-if="!updateRunning && updateRequested" @click="runUpdate()" 
    :class="{shakeButton: shakeButton}">
      Aktualisieren
    </button>

    <LoadingIcon v-if="updateRunning" id="_LoadingIcon" />

    <span v-if="msg"
    :class="[{good: type === 'good'}, {info: type === 'info'}]">
      {{ msg }}
    </span>
  </div>
</template>

<script>
import LoadingIcon from '@/components/global/LoadingIcon'
import func from '@/includes/js/functions'
const log = console.log

export default {
  name: 'UpdateInfo',
  components: { LoadingIcon },
  data() {
    return {
      user: null,
      msg: null,
      type: null,
      updateRunning: false,
      updateRequested: false,
      shakeButton: false
    }
  },
  methods: {
    async runUpdate() {
      if (!this.updateRunning) {
        this.$store.commit('setUpdateRunning', true)
      }
    }
  },
  created() {
    const clearInfo = {
      msg: null,
      type: null
    }

    this.$store.subscribe(async(mutation, state) => {
      if (mutation.type === 'setUpdateRequested') {
        this.updateRequested = state.updateRequested
      }

      if (mutation.type === 'setUpdateRunning') {
        this.updateRunning = state.updateRunning

        if (!this.updateRunning) {
          this.$store.commit('setInfo', {
            msg: 'Aktualisiert!',
            type: 'good'
          })
        }
      }

      if (mutation.type === 'setInfo') {
        if (!this.msg) {
          this.msg = state.updateInfo.msg
          this.type = state.updateInfo.type
          this.duration = state.updateInfo.duration

          setTimeout(() => {
            this.$store.commit('setInfo', clearInfo)
            this.msg = null
          }, 4000 || this.duration)
        }
      }

      if (mutation.type === 'setShakeButton') {
        this.shakeButton = state.shakeButton
      }
    })
  }
}
</script>

<style lang="scss" scoped>
@import '@/includes/scss/centerX';

#_LoadingIcon {
  @include centerX;
  bottom: 50px;
  transform: scale(0.7);
}

#Main {
  position: relative;
}

span {
  position: absolute;
  left: 10px;
  bottom: 20px;
  color: rgba(0, 0, 0, 0.6);
  padding: 5px 20px 5px 20px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 5px;
  background-color: orangered;
  animation: moveUp 0.35s normal ease-out;
}

@keyframes moveUp {
  0% {
      top: 60px;
  }
  100% {
      top: 0px;
  }
}

.good {
  background-color: limegreen !important;
}

.info {
  background-color: rgb(230, 187, 48) !important;
}

#LoadingIcon {
  top: 0px;
}

.shakeButton {
  display: inline-block;
  animation: wiggle 2.7s;
  background-color: orangered;
  &:hover {
    animation: none;
  }
}

button {
  color: rgba(0, 0, 0, 0.6);
  padding: 5px 20px 5px 20px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 5px;
  background-color: rgb(48, 235, 95);
  // box-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: .2s ease;
  &:hover {
    transform: scale(1.05);
  }
}

.good {
  background-color: limegreen !important;
}

/*SHAKER*/
@keyframes wiggle {
  2% {
    -webkit-transform: translateX(3px) rotate(2deg);
    transform: translateX(3px) rotate(2deg);
  }
  4% {
    -webkit-transform: translateX(-3px) rotate(-2deg);
    transform: translateX(-3px) rotate(-2deg);
  }
  6% {
    -webkit-transform: translateX(3px) rotate(2deg);
    transform: translateX(3px) rotate(2deg);
  }
  8% {
    -webkit-transform: translateX(-3px) rotate(-2deg);
    transform: translateX(-3px) rotate(-2deg);
  }
  10% {
    -webkit-transform: translateX(2px) rotate(1deg);
    transform: translateX(2px) rotate(1deg);
  }
  12% {
    -webkit-transform: translateX(-2px) rotate(-1deg);
    transform: translateX(-2px) rotate(-1deg);
  }
  14% {
    -webkit-transform: translateX(2px) rotate(1deg);
    transform: translateX(2px) rotate(1deg);
  }
  16% {
    -webkit-transform: translateX(-2px) rotate(-1deg);
    transform: translateX(-2px) rotate(-1deg);
  }
  18% {
    -webkit-transform: translateX(1px) rotate(0);
    transform: translateX(1px) rotate(0);
  }
  20% {
    -webkit-transform: translateX(-1px) rotate(0);
    transform: translateX(-1px) rotate(0);
  }
}
/*END SHAKER*/

</style>