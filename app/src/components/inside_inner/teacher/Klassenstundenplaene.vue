<template>
  <div>
    <section id="Main" @contextmenu.prevent>

      <div id="ClassSelector" v-if="classes.length >= 1">
        <Select class="_Select" :options="classes" :style="{zIndex: 300}"  
          @optionSelected="fetchClassSchedule" :selType="'Class'"
          :widthFix="true"/>
           <!-- Week Type Toggler -->
          <button id="weekTypeToggler" @click="changeWeekType()" v-show="selectedClass"
          :class="{unevenWeek: unevenWeek}">
            <span>{{ unevenWeek?
              'Ungerade Woche':
              'Gerade Woche' }}</span>
          </button>
      </div>
      
      <div id="Schedule" v-if="columnsNum >= 1">
        <!-- Hours -->
        <ul id="HourList">
          <li v-for="hourNum in columnsNum" :key="hourNum">
            <span>{{ `${hourNum}.` }}</span>
          </li>
        </ul>
        <ul id="Days">
          <li v-for="(n, day) in 5" :key="day">
            <span class="weekDayTitle">{{ weekDayTitles[n-1].toUpperCase() }}</span>
            <ul id="Hours">
              <li v-for="(n, hour) in columnsNum" :key="hour">

                <div>
                  <div class="items" v-if="hours[day][hour]"
                    :class="{coupledTop: couplers[day][hour]}"
                    :style="{backgroundColor: chooseScheduleColor(hours[day][hour], 'List')}">

                    <span class="hourTeacherName">
                      {{ adjustedTeacherName(day, hour) }}
                    </span>
                    <span class="hourSubjName" :style="{backgroundColor: chooseScheduleColor(hours[day][hour], 'Subject')}">
                      {{ hours[day][hour].name.substring(0, 3) }}
                    </span>
                  </div>
                  <div v-else class="fieldPlaceholder">
                    Frei
                  </div>
                  <div v-if="hours[day][hour]" class="room"
                    :class="{coupledTopRoom: couplers[day][hour]}"
                    :style="{backgroundColor: chooseScheduleColor(hours[day][hour], 'List', true)}">
                     <span>
                      {{ 
                        hours[day][hour].room?
                        hours[day][hour].room.name:
                        '-' 
                      }}
                    </span>
                  </div>
                </div>

                 <div v-if="couplers[day][hour]">
                  <div class="items" v-if="hours[day][hour]"
                    :class="{coupledBottom: couplers[day][hour]}"
                    :style="{backgroundColor: chooseScheduleColor(couplers[day][hour], 'List')}">
                    <span class="hourTeacherName">
                      {{ adjustedTeacherName(day, hour, true) }}
                    </span>
                    <span class="hourSubjName" :style="{backgroundColor: chooseScheduleColor(couplers[day][hour], 'Subject')}">
                      {{ couplers[day][hour].name.substring(0, 3) }}
                    </span>
                  </div>
                  <div v-else class="fieldPlaceholder">
                    Frei
                  </div>
                  <div v-if="couplers[day][hour]" class="room" :class="{coupledBottomRoom: couplers[day][hour]}"
                    :style="{backgroundColor: chooseScheduleColor(couplers[day][hour], 'List', true)}">
                    <span>
                      {{ 
                        couplers[day][hour].room?
                        couplers[day][hour].room.name:
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
      couplers: [[], [], [], [], []],
      hours: [[], [], [], [], []],
      weekDayTitles: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'],
      classes: [],
      teachers: [],
      selectedClass: null,
      listColors: ['235, 64, 52', '144, 104, 255', '50, 201, 30', '24, 156, 204', '105, 21, 189', '173, 18, 184',
       '227, 95, 0', '146, 227, 84', '255, 102, 153', '68, 66, 212', '50, 207, 186'],
      rooms: [],
      unevenWeek: false
    }
  },
  methods: {
    ...mapActions([
      'fetchClasses'
    ]),
    changeWeekType() {
      if (!this.updateRequested) {
        this.unevenWeek = !this.unevenWeek

        this.fetchClassSchedule(this.selectedClass)
        
        this.$forceUpdate()
      } else {
        this.blockClickBeforeUpdate()
      }
    },
    getRoomType(day, hour) { // Maybe instead just button to show the room type above schedule when clicked
      if (this.hours[day][hour].room) {
        if (this.hours[day][hour].room.type !== 'Normaler Raum') {
          return this.hours[day][hour].room.type
        }
      }
    },
    adjustedTeacherName(day, hour, coupled = false) {
      let name

      if (coupled) {
        if (this.couplers[day][hour].teacherName) { // prevent errors
          name = this.couplers[day][hour].teacherName.split(' ')
        } else {
          name = ""
        }
      } else {
         if (this.hours[day][hour].teacherName) { // prevent errors
          name = this.hours[day][hour].teacherName.split(' ')
        } else {
          name = ""
        }
      }

      if (name !== "") {
        const fname = name[0].charAt(0)
        const lname = name[name.length - 1]

        return `${fname}. ${lname}`
      }
    },
    chooseColor(i, type) {
      if (type === 'List') {
        return `rgb(${this.listColors[i]})`
      } else {
        return `rgb(0, 0, 0, 0.2)`
      }
    },
    chooseScheduleColor(subj, type, isRoom = false) {
      const i = this.selectable.findIndex(x => x.name === subj.name)
      
      if (type === 'List') {
          if (isRoom) {
            if (i !== -1) {
              return `rgba(${this.listColors[i]}, 0.5)`
            }
            return `rgb(121, 126, 130)`
          } else {
              if (i !== -1) {
              return `rgb(${this.listColors[i]})`
            }
            return `rgb(215, 215, 215)`
          }
      } else {
        return `rgba(0, 0, 0, 0.2)`
      }
    },
    setInfo(msg, type) {
      const infoPayload = { msg, type }
      this.$store.commit('setUpdateInfoMsg', infoPayload)
    },
    async fetchClassSchedule(selectedClass) {
      // Remove insertNotOkClass from fields, so that they don't seem unavailable for no reason after class switch
      this.selectedSubj = null

      this.selectedClass = selectedClass

      const classSchedule = await axios.post(`${config.domain}/fetch-class-schedule`, {
        classID: this.selectedClass._id,
        unevenWeek: this.unevenWeek
      })

      await this.fetchAssignedSubjects()

      if (classSchedule.data.days.length >= 1) {
        this.hours = classSchedule.data.days
        this.couplers = classSchedule.data.couplers
      } else {
        this.hours = [[], [], [], [], []]
        this.couplers = [[], [], [], [], []]
      }
    },
    async fetchAssignedSubjects() {
      let response = await axios.post(`${config.domain}/fetch-assigned-subjects`, {
        classID: this.selectedClass._id
      })

      this.selectable = []

      response.data.assignedSubjects.forEach((subject) => {
        // Create Selectables
        this.selectable.push({
          ...subject,
          selected: false
        })
        // Create Teachers for Schedule Update of staticNotAvailable
        this.teachers.push({
          teacherUname: subject.teacherUname,
          teacherID: subject.teacherID,
          staticNotAvailable: subject.staticNotAvailable,
          uw_staticNotAvailable: subject.uw_staticNotAvailable,
          needsDBUpdate: false
        })
      })

      // Remove duplicates from Teachers
      const unique = new Set(this.teachers.map(e => JSON.stringify(e)));
      this.teachers = Array.from(unique).map(e => JSON.parse(e));
    }
  },
  async created() {
    this.$store.subscribe(async(mutation, state) => {
      if (mutation.type === 'setClasses') {
        this.classes = state.classes
      }
    })

    // Get Schedule column amount
    const class_res = await axios.get(`${config.domain}/fetch-schedule-column-num`)
    this.columnsNum = class_res.data.columnsNum

    // Get classes
    this.classes = await this.fetchClasses()
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

#ClassSelector {
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
            border: 1px solid rgba(0, 0, 0, 0.6);
            width: 80%;
            height: 100%;
            transition: .15s ease;
            &:hover {
              transform: scale(1.05);
            }
            span {
              font-size: 12px;
              padding: 3px;
              color: white;
            }
            .hourSubjName {
              border-radius: 3px;
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

.coupledTop {
  position: absolute;
  top: 0;
  left: 0;
  width: 80% !important;
  height: 45% !important;
}

.coupledBottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 80% !important;
  height: 45% !important;
  margin-top: 5% !important;
}

.coupledTopRoom {
  position: absolute !important;
  top: 0;
  right: 0;
  width: 20% !important;
  height: 45% !important;
}

.coupledBottomRoom {
  position: absolute !important;
  bottom: 0;
  right: 0;
  width: 20% !important;
  height: 45% !important;
  margin-top: 5% !important;
}

.fullWidth {
  width: 100% !important;
}

</style>