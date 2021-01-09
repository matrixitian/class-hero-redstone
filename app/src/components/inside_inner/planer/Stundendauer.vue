<template>
  <div>
    <div id="Main">

      <section id="Titles">
        <span>Stundendauer</span>
      </section>
      <section id="Hours">
        <ul id="HourCount">
          <transition-group name='fade'>
          <li v-for="hour in hourAmount" :key="hour">
            <span>{{ hour }}</span>
          </li>
          </transition-group>
        </ul>
        <ul id="HoursFrom">
          <transition-group name='fade'>
          <li v-for="(time, i) in hoursFrom" :key="i">
            <input v-model='hoursFrom[i]' placeholder="SS:MM">
          </li>
          </transition-group>
        </ul>
        <ul id="HoursTo">
          <transition-group name='fade'>
            <li v-for="(time, i) in hoursTo" :key="i">
            <input v-model='hoursTo[i]' placeholder="SS:MM">
          </li>
          </transition-group>
        </ul>
      </section>
      <section id="HourAdder">
        <div class="buttonPositioner">
          <button @click="addHour()">
            <img class="add" src="@/assets/icons/add.svg">
          </button>
        </div>
        <div class="buttonPositioner">
          <button @click="removeHour()" class="red">
            <img class="add" src="@/assets/icons/subtract.svg">
          </button>
        </div>
      </section>

    </div>

    <transition name="fade">
    <!-- '> 2' because: 2 changes occur upon loading of hoursFrom & hoursTo -->
      <section id="Update" v-if="changed > 2">
        <button @click="updateHours()">
          Aktualisieren
        </button>
      </section>
    </transition>
  </div>
</template>

<script>
import axios from 'axios'
import config from '@/includes/js/config'
const log = console.log

export default {
  name: 'Stundendauer',
  data() {
    return {
      hourAmount: 8,
      hoursFrom: [],
      hoursTo: [],
      changed: 0,
      loaded: false,
      creatingRoom: false
    }
  },
  watch: {
    hoursFrom: function(val) {
      this.changed++
    },
    hoursTo: function(val) {
      this.changed++
    }
  },
  methods: {
    removeHour() {
      this.hourAmount--
      this.hoursFrom.pop()
      this.hoursTo.pop()
    },
    addHour() {
      this.hourAmount++
      this.hoursFrom.push('')
      this.hoursTo.push('')
    },
    async updateHours() {
      const data = {
        hoursFrom: this.hoursFrom,
        hoursTo: this.hoursTo
      }

      const res = await axios.patch(`${config.domain}/update-schedule-times`, data)
      let payload
      if (res.status === 204) {
        payload = {
          msg: 'Aktualisiert',
          type: 'good'
        }

        this.$store.commit('setUpdateInfoMsg', payload)
        this.changed = 2
      } else {
        payload = {
          msg: 'Fehler. Bitte versuchen Sie es erneut.',
          type: 'bad'
        }

        this.$store.commit('setUpdateInfoMsg', payload)
      }
    }
  },
  async created() {
    const res = await axios.get(`${config.domain}/fetch-schedule-times`)
  
    this.hourAmount = res.data[0].hoursFrom.length
    this.hoursFrom = res.data[0].hoursFrom
    this.hoursTo = res.data[0].hoursTo
    this.loaded = true
  }
}
</script>

<style lang="scss" scoped>
@import '@/includes/scss/animations/Fade';
@import '@/includes/scss/centerXY';
@import '@/includes/scss/flexCenter';

$TimesWidth: 200px;
$HourCountWidth: 60px;
$listItemHeight: 40px;

div#Main {
  @include centerXY;
  width: $TimesWidth*2 + $HourCountWidth;
  display: grid;
  box-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.4);
  border-radius: 5px;
  section#Titles {
    position: relative;
    height: 40px;
    margin-bottom: 5px;
    background-color: rgb(127, 127, 167);
    border: 1px solid rgba(0, 0, 0, 0.2);
    width: 100%;
    span {
      @include centerXY;
      color: white;
      font-size: 18px;
    }
  }
  section#HourAdder {
    @include flexCenter;
    width: ($TimesWidth*2 + $HourCountWidth);
    background-color: rgba(0, 0, 0, 0.3);
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    height: 60px;
    padding: 10px 0 10px 0;
    text-align: center;
    div + div {
      margin-left: 15px;
    }
    div.buttonPositioner {
      padding: 5px;
      border-radius: 5px;
      border: 2px dashed rgba(255, 255, 255, 0.15);
      transition: .25s ease;
      &:hover {
        background-color: rgba(255, 255, 255, 0.25);
      }
      button {
        position: relative;
        background-color: rgb(34, 172, 34);
        border: 2px solid rgb(123, 207, 123);
        height: 40px; width: 40px;
        border-radius: 100%;
        outline: none;
        transition: .15s ease;
        &:hover {
          transform: scale(1.06);
        }
        img.add {
          @include centerXY;
          height: 15px;
        }
      }
    }
  }
}

.red {
  border: 2px solid rgb(255, 170, 90) !important;
  background-color: rgb(255, 123, 0) !important;
}

li {
  position: relative;
  height: $listItemHeight;
  border: 1px solid rgba(0, 0, 0, 0.2);
  span {
    @include centerXY;
  }
  input {
    @include centerXY;
    text-align: center;
    font-size: 16px;
    height: 80%;
    width: 90%;
  }
}

 section#Hours {
   display: grid;
   width: $TimesWidth;
   grid-template-columns: $HourCountWidth $TimesWidth $TimesWidth;
   ul#HourCount {
     background-color: rgb(119, 125, 151);
     li > span {
       color: white;
       font-weight: bold;
       font-size: 17px;
     }
   }
   ul#HoursFrom {
     background-color: rgb(93, 99, 116);
   }
   ul#HoursTo {
     background-color: rgb(93, 99, 116);
   }
   input {
    color: #f0f0f0;
    font-size: 17px;
    border: 1px solid rgba(0, 0, 0, 0.35);
    background-color: transparent;
    &:hover {
      border: 1px solid rgb(45, 179, 78);
    }
    &::placeholder {
      color: rgba(0, 0, 0, 0.5);
    }
   }
 }

section#Update {
  left: -300px;
  position: absolute;
  height: 30px;
  width: 100%;
  margin-top: 10px;
  button {
    // @include centerXY;
    padding: 9px 20px 9px 20px;
    font-size: 15px;
    font-weight: bold;
    border-radius: 3px;
    background-color: rgb(34, 172, 34);
    box-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.2);
    color: #f0f0f0;
  }
}

</style>