<template>
  <div>
    <section id="Main" @contextmenu.prevent v-if="fetched">

      <!-- Week Type Toggler -->
      <div id="WeekType">
          <button id="weekTypeToggler"
          @click="changeWeekType()"
          :class="{unevenWeek: unevenWeek}">
            <span>{{ unevenWeek?
              'Ungerade Woche':
              'Gerade Woche' }}</span>
          </button>
      </div>
      
      <div id="Schedule" v-if="true">
        <!-- Hours -->
        <ul id="HourList">
          <li v-for="hourNum in 8" :key="hourNum">
            <span>{{ `${hourNum}.` }}</span>
          </li>
        </ul>
        <ul id="Days">
          <li v-for="(n, day) in 5" :key="day">
            <span class="weekDayTitle">{{ weekDayTitles[n-1].toUpperCase() }}</span>
            <ul id="Hours">
              <li v-for="(n, hour) in 8" :key="hour">

                <div>
                  <div class="items" v-if="hours[day][hour]"
                    :style="{backgroundColor: chooseScheduleColor(hours[day][hour].subjectName, 'Subject')}">

                    <div class="hourSubjectName">
                      <span>
                        {{ hours[day][hour].subjectName }}
                      </span>
                    </div>
                    <!-- CLASS NAME -->
                    <span class="hourClassName" 
                    :style="{backgroundColor: chooseScheduleColor(hours[day][hour].className, 'Class')}">
                      {{ hours[day][hour].className }}
                    </span>
                  </div>
                  <div v-else class="fieldPlaceholder">
                    Frei
                  </div>
                  <div v-if="hours[day][hour]" class="room"
                    :style="{backgroundColor: chooseScheduleColor(hours[day][hour].room.name, 'Room')}">
                     <span>
                      {{ 
                        hours[day][hour].room?
                        hours[day][hour].room.name:
                        '-' 
                      }}
                    </span>
                  </div>
                </div>
                
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script>
const _ = require('lodash')
const cloneDeep = require('clone-deep')
import Select from '@/components/global/Select'
import axios from 'axios'
import config from '@/includes/js/config'
import { mapActions } from 'vuex'
const log = console.log

export default {
  name: 'Stundenplan',
  components: { Select },
  data() {
    return {
      columnsNum: 0,
      hours: [[], [], [], [], []],
      weekDayTitles: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'],
      subjectColors: ['105, 21, 189', '173, 18, 184','227, 95, 0', '146, 227, 84'],
      classAndRoomColors: ['235, 64, 52', '144, 104, 255', '50, 201, 30', '24, 156, 204', '255, 102, 153', '68, 66, 212', '50, 207, 186'],
      rooms: [],
      unevenWeek: false,
      fetched: false,
      // For color assignment
      subjects: [],
      classes: [],
      rooms: []
    }
  },
  methods: {
    ...mapActions([
      'fetchClasses'
    ]),
    changeWeekType() {
      if (!this.updateRequested) {
        this.unevenWeek = !this.unevenWeek

        this.fetchTeacherScheduleData()
        
        this.$forceUpdate()
      }
    },
    getRoomType(day, hour) { // Maybe instead just button to show the room type above schedule when clicked
      if (this.hours[day][hour].room) {
        if (this.hours[day][hour].room.type !== 'Normaler Raum') {
          return this.hours[day][hour].room.type
        }
      }
    },
    chooseScheduleColor(listItem, type) {
      let i
      // Subject Color
      if (type === 'Subject') {
        i = this.subjects.findIndex(x => x === listItem)

        return `rgb(${this.subjectColors[i]})`
      }
      // Class Color
      else if (type === 'Class') {
        i = this.classes.findIndex(x => x === listItem)

        return `rgba(${this.classAndRoomColors[i]}, 1)`
      } 
      // Room Color
      else if (type === 'Room') {
        i = this.rooms.findIndex(x => x === listItem)

        return `rgba(${this.classAndRoomColors[i]}, 1)`
      }
    },
    setInfo(msg, type) {
      const infoPayload = { msg, type }
      this.$store.commit('setUpdateInfoMsg', infoPayload)
    },
    async fetchTeacherScheduleData() {
      let response = await axios.post(`${config.domain}/fetch-teacher-schedule-data`, {
        unevenWeek: this.unevenWeek
      })

      this.hours = [[], [], [], [], []]

      let dayIndex = -1
      response.data.scheduleData.forEach(day => {
        dayIndex++
        day.forEach(arrPlace => {
          if (arrPlace) {
            this.hours[dayIndex][arrPlace.hour] = arrPlace
            this.subjects.push(arrPlace.subjectName)
            this.classes.push(arrPlace.className)
            this.rooms.push(arrPlace.room.name)
          }
        })
      })

      this.subjects = _.uniq(this.subjects)
      this.classes = _.uniq(this.classes)
      this.rooms = _.uniq(this.rooms)

      this.fetched = true
    }
  },
  async created() {
    this.fetchTeacherScheduleData()
  }
}
</script>

<style lang="scss" scoped>
@import '@/includes/scss/centerX';
@import '@/includes/scss/centerXY';
@import '@/includes/scss/flexCenter';

.unevenWeek {
  background-color: rgb(47, 189, 255) !important;
}

.weekDayTitle {
  @include centerX;
  top: -45px;
  color: #f9f9f9;
  font-weight: bold;
  font-size: 18px;
  background-color: rgba(255, 255, 255, 0.15);
  padding: 5px 10px 5px 10px;
  border-radius: 4px;
  border-bottom: 2px solid black;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

#WeekType {
  @include flexCenter;
  margin-top: 20px;
  ._Select {
    // color: white !important;
    width: 200px;
    margin-right: 20px;
    background-color: yellowgreen !important;
    border: 1px solid black !important;
  }
  button#weekTypeToggler {
    padding: 5px 10px 5px 10px;
    border-radius: 5px;
    font-weight: bold;
    outline: none;
    border: 1px solid black;
    background-color: rgb(47, 255, 99);
    transition: .25s ease;
    &:hover {
      transform: scale(1.05);
    }
  }
}

$listHeight: 45px;

#Schedule {
  @include centerXY;
  display: grid;
  grid-template-columns: 5% 95%;
  margin-top: auto;
  margin-bottom: auto;
  width: 100%;
  #HourList {
    li {
      z-index: 500;
      position: relative;
      height: $listHeight;
      border: 1px dashed rgba(0, 0, 0, 0.45);
      font-weight: bold;
      font-size: 18px;
      color: #f9f9f9;
      span, input {
        @include centerXY;
      }
    }
  }
  #Days {
    display: grid;
    grid-template-columns: 20% 20% 20% 20% 20%;
    li {
      position: relative;
    }
    ul#Hours {
      position: relative;
      li {
        display: grid;
        grid-template-rows: 1fr 1fr;
        position: relative;
        @include flexCenter;
        height: $listHeight;
        border: 1px solid rgba(0, 0, 0, 0.4);
        background-color: transparent;
        div {
          @include flexCenter;
          width: 100%;
          height: 100%;
          div.items {
            @include flexCenter;
            display: grid;
            grid-template-columns: 4fr 1.5fr;
            border: 1px solid rgba(0, 0, 0, 0.6);
            width: 80%;
            height: 100%;
            transition: .15s ease;
            &:hover {
              transform: scale(1.05);
            }
            .hourSubjectName {
              position: relative;
              font-size: 15px;
              span {
                position: absolute;
                display: inline-block;
                color: white;
                font-size: 14px;
                left: 10px;
              }
            }
            .hourClassName {
              z-index: 10;
              font-size: 14px;
              padding: 7px;
              margin-right: 3px;
              border: 1px solid black;
              border-radius: 3px;
              font-weight: bold;
              box-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.25);
            }
          }
          .room {
            z-index: 1000;
            height: 100%;
            width: 20%;
            border: 1px solid rgba(0, 0, 0, 0.6);
            border-left: none;
            color: whitesmoke;
            background-color: rgb(25, 158, 58);
            cursor: pointer;
            transition: .15s ease;
            &:hover {
              transform: scale(1.05);
            }
            span {
              @include flexCenter;
              font-weight: bold;
            }
          }
          div.fieldPlaceholder {
            @include flexCenter;
            color: rgb(156, 156, 156);
            width: 100%;
            height: 100%;
            cursor: default;
          }
        }
      }
    }
  }
}

</style>