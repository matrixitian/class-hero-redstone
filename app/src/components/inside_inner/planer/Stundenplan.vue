<template>
  <div>
    <button class="closeRoomList" v-if="roomListActive" @click="closeRoomList()">
      Raumliste schließen
    </button>
    <RoomSelector @selected="assignRoom" v-if="roomListActive"
    :day="selectedRoom.day" :hour="selectedRoom.hour"/>

    <div id="Blur" v-if="roomListActive"></div>

    <section id="Main" @contextmenu.prevent>

      <div id="ClassSelector" v-if="classes.length >= 1" @click="blockClickBeforeUpdate()">
        <Select class="_Select" :options="classes" :style="{zIndex: 300}"  
          @optionSelected="fetchClassSchedule" :selType="'Class'"
          :class="{blockClickBeforeUpdate: updateRequested}"
          :widthFix="true"/>
      </div>

      <div id="WeekType" v-show="selectedClass">
        <!-- Week Type Toggler -->
        <button id="weekTypeToggler" @click="changeWeekType()"
        :class="{unevenWeek: unevenWeek}">
          <span>{{ unevenWeek?
            'Ungerade Woche':
            'Gerade Woche' }}</span>
        </button>
        <!-- Schedule Copier -->
        <button id="scheduleCopy" v-if="!scheduleCopied && unevenWeek" @click="copySchedule()">
          <span>Geraden Plan kopieren</span>
        </button>
      </div>

      <ul id="SubjectList">
        <li v-for="(subj, i) in selectable" :key="i" :style="{backgroundColor: chooseColor(i, 'List')}"
        @click="selectSubject(i)" :class="{selected: subj.selected}">
          <span class="selectable">
            <span class="teacherName">{{ subj.teacherName }}</span>
            <span class="subjName" :style="{backgroundColor: chooseColor(i, 'Subject')}">
              {{ subj.name.substring(0, 3) }}
            </span>
          </span>
        </li>
      </ul>
      
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
              <li v-for="(n, hour) in columnsNum" :key="hour"
              :class="{showPointer: hours[day][hour]}">
                <!-- Hour Coupler -->
                <button class="Coupler" v-if="hours[day][hour] && !couplers[day][hour]"
                @click="coupleHour(day, hour)">
                  <i class="fas fa-link"></i>
                </button>

                <div>
                  <!-- Cover -->
                  <div class="cover" v-if="checkInsertOK(day, hour)"
                  :class="{fullWidth: !hours[day][hour]}"
                  @click="throwErrInsertBlocked()">
                    <div class="bgCircle"></div>
                    <i class="fa fa-exclamation-circle"></i>
                  </div>
                  <div class="items" v-if="hours[day][hour]"
                    @mousedown.left="insertSubj(day, hour)"
                    @mousedown.right="clearField(day, hour)"
                    :class="{coupledTop: couplers[day][hour]}"
                    :style="{backgroundColor: chooseScheduleColor(hours[day][hour], 'List')}">

                    <span class="hourTeacherName">
                      {{ adjustedTeacherName(day, hour) }}
                    </span>
                    <span class="hourSubjName" :style="{backgroundColor: chooseScheduleColor(hours[day][hour], 'Subject')}">
                      {{ hours[day][hour].name.substring(0, 3) }}
                    </span>
                  </div>
                  <div v-else class="fieldPlaceholder" @mousedown.left="insertSubj(day, hour)">
                    -
                  </div>
                  <div v-if="hours[day][hour]" class="room"
                    :class="{coupledTopRoom: couplers[day][hour]}"
                    @click="openRoomSelector(day, hour)"
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

                 <div class="coverHalf"
                 v-if="checkCoupleUnavailable(day, hour)"
                 :class="{coverTop: checkCoupleUnavailable(day, hour, 'class') == 'top'}">
                    <div class="bgCircle"></div>
                    <i class="fa fa-exclamation-circle"></i>
                  </div>
                 <div v-if="couplers[day][hour]">
                  <div class="items" v-if="hours[day][hour]"
                    :class="{coupledBottom: couplers[day][hour]}"
                    @mousedown.left="insertSubj(day, hour, true)"
                    @mousedown.right="clearField(day, hour, true)"
                    :style="{backgroundColor: chooseScheduleColor(couplers[day][hour], 'List')}">
                    <span class="hourTeacherName">
                      {{ adjustedTeacherName(day, hour, true) }}
                    </span>
                    <span class="hourSubjName" :style="{backgroundColor: chooseScheduleColor(couplers[day][hour], 'Subject')}">
                      {{ couplers[day][hour].name.substring(0, 3) }}
                    </span>
                  </div>
                  <div v-else class="fieldPlaceholder" @mousedown.left="insertSubj(day, hour)">
                    -
                  </div>
                  <div v-if="couplers[day][hour]" class="room" :class="{coupledBottomRoom: couplers[day][hour]}"
                    @click="openRoomSelector(day, hour, true)"
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
import RoomSelector from '@/components/global/RoomSelector'
import Select from '@/components/global/Select'
import axios from 'axios'
import config from '@/includes/js/config'
import { mapActions } from 'vuex'
const log = console.log

export default {
  name: 'Stundenplan',
  components: { RoomSelector, Select },
  data() {
    return {
      columnsNum: 0,
      couplers: [[], [], [], [], []],
      hours: [[], [], [], [], []],
      weekDayTitles: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'],
      classes: [],
      teachers: [],
      selectable: [],
      selectedClass: null,
      roomListActive: false,
      selectableReady: false,
      listColors: ['235, 64, 52', '144, 104, 255', '50, 201, 30', '24, 156, 204', '105, 21, 189', '173, 18, 184',
       '227, 95, 0', '146, 227, 84', '255, 102, 153', '68, 66, 212', '50, 207, 186'],
      selectedSubj: null,
      selectedRoom: {
        day: null,
        hour: null
      },
      insertOK: true,
      fieldHovered: {
        day: null,
        hour: null
      },
      rooms: [],
      changed: false,
      updateRequested: false,
      isSecondRoom: false,
      roomForTransferBeforeClear: null,
      unevenWeek: false,
      scheduleCopied: false,
      backupCouplers: [[], [], [], [], []],
      backupHours: [[], [], [], [], []]
    }
  },
  methods: {
    ...mapActions([
      'fetchClasses',
      'fetchRooms'
    ]),
    copySchedule() {
      if (this.unevenWeek && !this.scheduleCopied) {
        this.hours = this.backupHours
        this.couplers = this.backupCouplers

        this.scheduleCopied = true
        this.$store.commit('setUpdateRequested', true)
      }
    },
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
    checkCoupleUnavailable(day, hour, displayType = "") {
      if (this.selectedSubj && this.hours[day][hour]) { // errp
        // If field teacherID and selectedSubj teacherID are the same
        // and coupler exists!
        if (this.hours[day][hour].teacherID == this.selectedSubj.teacherID) {
          if (this.couplers[day][hour]) { // errp
              // Check that coupler it has dummy data... so that we know it exists
            if (this.couplers[day][hour].name == "" || this.couplers[day][hour].teacherID) {
              if (displayType === "class") {
                return "bottom"
              }
              return true
            }
          }
        } else if (this.couplers[day][hour]) { // errp
          if (this.couplers[day][hour].teacherID == this.selectedSubj.teacherID) {
            if (displayType === "class") {
              return "top"
            }
              return true
            }
          }
      }
      
      if (this.selectedSubj && this.couplers[day][hour]) {
        if (this.couplers[day][hour].teacherID == this.selectedSubj.teacherID) {
          if (type === "class") {
            return "bottom"
          }
          return true
        }
      }
    },
    coupleHour(day, hour) {
      this.couplers[day][hour] = {name: ''}
      
      this.$forceUpdate()
      this.$store.commit('setUpdateRequested', true)
    },
    blockClickBeforeUpdate() {
      if (this.updateRequested) {
        this.$store.commit('setShakeButton', true)
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
    clearHoveredField() {
      this.fieldHovered.day = null
      this.fieldHovered.hour = null
      this.insertOK = true
    },
    addNotInsertableClass(day, hour) {
      if (day === this.fieldHovered.day && hour === this.fieldHovered.hour && !insertOK) {
        return true
      }
    },
    checkInsertOK(day, hour) {
      if (this.selectedSubj) {
        if (this.hours[day][hour] != undefined) {
          // If Teacher in staticNotAvailable has at day this hour value in the list
          let hourOK

          if (this.unevenWeek) {
            hourOK = !this.selectedSubj.uw_staticNotAvailable[day].includes(hour)
          } else {
            hourOK = !this.selectedSubj.staticNotAvailable[day].includes(hour)
          }

          const sameTeacher = this.selectedSubj.teacherID === this.hours[day][hour].teacherID

          // If coupler exists don't show full cover, this makes it not run
          // the code under it if it's coupled
          if (this.couplers[day][hour]) {
            if (this.couplers[day][hour].name != "") {
              return false
            }
          }

          if (hourOK || sameTeacher) {
            this.insertOK = true
            return false
          } else {
            this.insertOK = false
            return true
          }

        } else {
          let hourOK
          if (this.unevenWeek) {
            hourOK = !this.selectedSubj.uw_staticNotAvailable[day].includes(hour)
          } else {
            hourOK = !this.selectedSubj.staticNotAvailable[day].includes(hour)
          }

          if (hourOK) {
            this.insertOK = true
            return false
          } else {
            this.insertOK = false
            return true
          }
        }
      }
    },
    async updateSchedule() {
      if (this.selectedClass) {
        let roomsForUpdate = []
        this.rooms.forEach(room => {
          if (room.needsDBUpdate) roomsForUpdate.push(room)
        })

        const data = null
        let teachersForUpdate = []

        this.teachers.forEach(teacher => {
          if (teacher.needsDBUpdate) {
            log('Teacher for update:', teacher)
            delete teacher.needsDBUpdate
            delete teacher.teacherUname

            teachersForUpdate.push(teacher)
          }
        })
      
        let response = await axios.post(`${config.domain}/update-schedule`, {
          classID: this.selectedClass._id,
          newSchedule: this.hours,
          roomsForUpdate,
          teachersForUpdate,
          couplers: this.couplers,
          unevenWeek: this.unevenWeek,
          scheduleCopied: this.scheduleCopied
        })
        
        
        if (response.status === 200) {
          this.setInfo('Plan Aktualisiert!', 'good')
          this.$store.commit('setUpdateRunning', false)

          // Reset Teachers and Rooms that need update after update ran succesfully
          this.teachers.forEach(teacher => {
            if (teacher.needsDBUpdate) {
              teacher.needsDBUpdate = false
            }
          })
        } else {
          this.$store.commit('setUpdateRunning', false)
          this.setInfo('Fehler', 'bad')
        }
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
          staticNotAvailableData: subject.staticNotAvailableData,
          uw_staticNotAvailable: subject.uw_staticNotAvailable,
          uw_staticNotAvailableData: subject.uw_staticNotAvailableData,
          needsDBUpdate: false
        })
      })

      // Remove duplicates from Teachers
      const unique = new Set(this.teachers.map(e => JSON.stringify(e)))
      this.teachers = Array.from(unique).map(e => JSON.parse(e))

      log('teacher accounts', this.teachers)
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

        if (this.unevenWeek) this.scheduleCopied = classSchedule.data.scheduleCopied
        log('schedule copied:', this.scheduleCopied)

        if (!this.unevenWeek) {
          this.backupHours = cloneDeep(classSchedule.data.days)
          this.backupCouplers = cloneDeep(classSchedule.data.couplers)
        }
      } else {
        this.hours = [[], [], [], [], []]
        this.couplers = [[], [], [], [], []]
      }
    },
    throwErrInsertBlocked() {
      this.setInfo('Diese Stunde wurde bereits einem anderem Stundenplan zugewiesen!', 'bad')
    },
    closeRoomList() {
      this.roomListActive = false
    },
    assignRoom(room) {
      const day = this.selectedRoom.day
      const hour = this.selectedRoom.hour

      let oldRoom

      if (this.isSecondRoom) {
        oldRoom = this.couplers[day][hour].room
      } else {
        oldRoom = this.hours[day][hour].room
      }

      if (oldRoom) {
        this.rooms.forEach(loopRoom => {
          if (loopRoom._id == oldRoom._id) {
            // Remove staticNotAvailable entry from old Room
            loopRoom.needsDBUpdate = true
            
            let index
            if (this.unevenWeek) {
              index = loopRoom.uw_staticTakenHours[day].indexOf(hour);
              loopRoom.uw_staticTakenHours[day].splice(index, 1);
            } else {
              index = loopRoom.staticTakenHours[day].indexOf(hour);
              loopRoom.staticTakenHours[day].splice(index, 1);
            }
            
          }
        })
      }

      this.rooms.forEach(loopRoom => {
        if (loopRoom._id == room._id) {
          loopRoom.needsDBUpdate = true

          // Add staticNotAvailable entry to newly added Room
          if (this.unevenWeek) {
            if (!loopRoom.uw_staticTakenHours[day].includes(hour)) {
              loopRoom.uw_staticTakenHours[day].push(hour)
            }
          } else {
            if (!loopRoom.staticTakenHours[day].includes(hour)) {
              loopRoom.staticTakenHours[day].push(hour)
            }
          }
          
        }
      })

      log('ROOM', room)

      // Add Room to Teacher's Schedule
      let teacherID
      if (this.isSecondRoom) {
        teacherID = this.couplers[day][hour].teacherID
      } else {
        teacherID = this.hours[day][hour].teacherID
      }
      
      let teacher = this.teachers.find(loopTeacher => loopTeacher.teacherID == teacherID)

      if (this.unevenWeek) {
        teacher.uw_staticNotAvailableData[day].forEach(arrPlace => {
          if (arrPlace) { // error fix
            if (arrPlace.hour === hour) {
              arrPlace.room.name = room.name
              arrPlace.room.type = room.type
            }
          }
        })
      } else {
        teacher.staticNotAvailableData[day].forEach(arrPlace => {
          if (arrPlace) { // error fix
            if (arrPlace.hour === hour) {
              arrPlace.room.name = room.name
              arrPlace.room.type = room.type
            }
          }
          log(arrPlace)
        })
      }
      teacher.needsDBUpdate = true
      
      log('TEACHER', teacher)
      
      // Add new Room to Schedule
      if (this.isSecondRoom) {
        this.couplers[day][hour].room = room
      } else {
        this.hours[day][hour].room = room
      }

      this.$store.commit('setRooms', this.rooms)
      log(this.rooms)
      
      this.roomListActive = false
      this.$store.commit('setUpdateRequested', true)
    },
    openRoomSelector(day, hour, condition = false) {
      this.isSecondRoom = condition

      this.selectedRoom.day = day
      this.selectedRoom.hour = hour
      this.roomListActive = true
    },
    clearField(day, hour, isSecondField = false) {
      let teacherID
      let roomID

      // Save room for remaining in the same field before field gets cleared
      if (this.hours[day][hour].room) {
        this.roomForTransferBeforeClear = this.hours[day][hour].room
      }

      if (isSecondField) {
        teacherID = this.couplers[day][hour].teacherID
        if (this.couplers[day][hour].room) {
          roomID = this.couplers[day][hour].room._id
        }
        
      } else {
        teacherID = this.hours[day][hour].teacherID
        if (this.hours[day][hour].room) {
          roomID = this.hours[day][hour].room._id
        }
      }

      // Make Room available again
      if (roomID) {
        let room = this.rooms.find(loopRoom => loopRoom._id == roomID)
        const roomIndex = room.staticTakenHours[day].indexOf(hour)

        if (this.unevenWeek) {
          room.uw_staticTakenHours[day].splice(roomIndex, 1)
        } else {
          room.staticTakenHours[day].splice(roomIndex, 1)
        }

        room.needsDBUpdate = true
      }
      
      // Make Teacher available again
      if (teacherID) {
        let teacher = this.teachers.find(loopTeacher => loopTeacher.teacherID == teacherID)

        let teacherIndex
        if (this.unevenWeek) {
          teacherIndex = teacher.uw_staticNotAvailable[day].indexOf(hour)
          teacher.uw_staticNotAvailable[day].splice(teacherIndex, 1)
          // Clear Teacher Schedule Data
          const hourIndex = teacher.uw_staticNotAvailableData[day].findIndex(x => x.hour === hour)
          teacher.uw_staticNotAvailableData[day].splice(hourIndex, 1)
        } else {
          teacherIndex = teacher.staticNotAvailable[day].indexOf(hour)
          teacher.staticNotAvailable[day].splice(teacherIndex, 1)
          // Clear Teacher Schedule Data
          const hourIndex = teacher.staticNotAvailableData[day].findIndex(x => x.hour === hour)
          teacher.staticNotAvailableData[day].splice(hourIndex, 1)
        }

        log('teacher cleared', teacher)
        
        teacher.needsDBUpdate = true
      }

      if (isSecondField) {
        this.couplers[day][hour] = null
      } else {
        this.hours[day][hour] = null
      }

      // Move Hour from couplers to hours !!
      if (this.hours[day][hour] == null && this.couplers[day][hour] != null) {
        this.hours[day][hour] = this.couplers[day][hour]
        this.couplers[day][hour] = null
      }

      this.$forceUpdate()
      this.$store.commit('setUpdateRequested', true)
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
    selectSubject(i) {
      this.selectable.forEach((subject) => {
        subject.selected = false
      })

      this.selectableReady = true

      this.selectable[i].selected = true // for CSS
      this.selectedSubj = this.selectable[i] // for JS

      this.$forceUpdate()
    },
    setInfo(msg, type) {
      const infoPayload = { msg, type }
      this.$store.commit('setUpdateInfoMsg', infoPayload)
    },
    insertSubj(day, hour, isSecondField = false) {
      if (!this.selectableReady) {
        this.setInfo('Wählen Sie bitte ein Fach zum einfügen!', 'bad')
        throw new Error()
      }

      const insertOK = !this.checkInsertOK(day, hour)

      if (insertOK) {
        // Save room for remaining in the same field before field gets cleared
        let roomForTransferBeforeClear

        if (isSecondField) {
          if (this.couplers[day][hour]) {
            roomForTransferBeforeClear = this.couplers[day][hour].room
          }
        } else {
          if (this.hours[day][hour]) {
            roomForTransferBeforeClear = this.hours[day][hour].room
          }
        }
       
        let oldTeacher
        if (isSecondField) {
          oldTeacher = this.couplers[day][hour]
        } else {
          oldTeacher = this.hours[day][hour]
        }
      
        const subject = this.selectedSubj
        const subjectForPush = {
          _id: subject._id,
          name: subject.name,
          teacherID: subject.teacherID,
          teacherName: subject.teacherName,
          day,
          hour
        }

        let found = this.teachers.find(obj => obj.teacherID == subjectForPush.teacherID)
        
        if (this.unevenWeek) {
          found.uw_staticNotAvailable[day].push(hour)
          found.uw_staticNotAvailableData[day].push(
            {
              hour,
              subjectName: subject.name,
              className: this.selectedClass.name,
              room: {
                name: null,
                type: null
              }
            }
          )
        } else {
          found.staticNotAvailable[day].push(hour)
          found.staticNotAvailableData[day].push(
            {
              hour,
              subjectName: subject.name,
              className: this.selectedClass.name,
              room: {
                name: null,
                type: null
              }
            }
          )
        }
        
        found.needsDBUpdate = true

        // Remove staticNotAvailable field from Teacher who was in the Schedule
        let foundOldTeacher
        if (oldTeacher) {
          const cleanUpStaticAvailableFromOldTeacher = () => {
            foundOldTeacher = this.teachers.find(teacher => teacher.teacherID == oldTeacher.teacherID)
            let index
            if (unevenWeek) {
              index = foundOldTeacher.uw_staticNotAvailable[day].indexOf(hour)
              foundOldTeacher.uw_staticNotAvailable[day].splice(index, 1)
              foundOldTeacher.uw_staticNotAvailableData[day].splice(index, 1)
            } else {
              index = foundOldTeacher.staticNotAvailable[day].indexOf(hour)
              foundOldTeacher.staticNotAvailable[day].splice(index, 1)
              foundOldTeacher.uw_staticNotAvailableData[day].splice(index, 1)
            }

            foundOldTeacher.needsDBUpdate = true
          }

        if (isSecondField) {
          if (this.couplers[day][hour].name) { // If it's not a dummy entry
            cleanUpStaticAvailableFromOldTeacher()
          }
        } else {
            if (this.hours[day][hour].name) { // If it's not a dummy entry
              cleanUpStaticAvailableFromOldTeacher()
            }
          }
        }
        
        if (isSecondField) {
          this.couplers[day][hour] = subjectForPush
          this.couplers[day][hour].room = roomForTransferBeforeClear
        } else {
          this.hours[day][hour] = subjectForPush
          this.hours[day][hour].room = roomForTransferBeforeClear
        }

        this.$forceUpdate()
        this.$store.commit('setUpdateRequested', true)
      }
    }
  },
  async created() {
    this.$store.subscribe(async(mutation, state) => {
      if (mutation.type === 'setClasses') {
        this.classes = state.classes
      }

      if (mutation.type === 'setUpdateRunning') {
        if (state.updateRunning) {
          this.updateSchedule()
        }
      }

      if (mutation.type === 'setUpdateRequested') {
        this.updateRequested = state.updateRequested
      }
    })

    // Get Rooms
    let room_res = await this.fetchRooms()
    this.rooms = room_res

    this.rooms.forEach(room => {
      room.needsDBUpdate = false
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

@mixin Button {
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

#WeekType {
  position: absolute;
  button#weekTypeToggler {
    @include Button;
  }
  button#scheduleCopy {
    margin-top: 30px;
    @include Button;
    background-color: rgb(255, 147, 47) !important;
  }
}
.unevenWeek {
  background-color: rgb(47, 189, 255) !important;
}

.blockClickBeforeUpdate {
  pointer-events: none;
}

.showPointer {
  cursor: pointer !important;
}

#Update {
  position: absolute;
  bottom: 50px;
  z-index: 10000;
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

button.Coupler {
  z-index: 1000;
  position: absolute;
  top: 0;
  left: 0;
  padding: 3px;
  border-radius: 3px;
  background-color: transparent;
  transition: .2s ease-out;
  &:hover {
    color: white;
    background-color: rgba(0, 0, 0, 0.2);
    box-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.4);
  }
}

button.closeRoomList {
  position: absolute;
  right: 0;
  z-index: 5000;
  background-color: red;
  padding: 5px;
}

#ClassSelector {
  @include flexCenter;
  ._Select {
    width: 200px;
    position: absolute;
    border: 1px solid black !important;
    // background-color: royalblue !important;
  }
}

section#Main {
  @include centerXY;
  // background-color: white;
  width: 95%;
  max-width: 1500px;
  height: 100%;
  display: grid;
  grid-template-rows: 1fr 2fr 10fr;
}

#Blur {
  z-index: 10;
  @include centerXY;
  background-color: rgba(0, 0, 0, 0.4);
  width: 90%;
  height: 90%;
}

#SubjectList {
  margin-top: auto;
  margin-bottom: auto;
  display: inline-block;
  border-radius: 4px;
  border: 2px dashed rgba(180, 180, 180, 0.6);
  max-height: 250px;
  li {
    border-radius: 4px;
    margin: 4px;
    display: inline-block;
    border: 1px solid rgba(0, 0, 0, 0.6);
    padding: 5px 0 5px 15px;
    transition: .15s ease;
    cursor: pointer;
    &:hover {
      transform: scale(1.04);
    }
    .subjName {
      border: 1px solid rgba(0, 0, 0, 0.6);
      border-radius: 3px;
      margin-left: 5px;
      padding: 3px 7px 3px 3px;
    }
  }
}

.selected {
  background-color: rgb(156, 156, 156) !important;
  .subjName {
    background-color: rgb(70, 68, 68) !important;
  }
}

span.selectable {
  color: whitesmoke;
}

.notInsertable {
  background-color: red !important;
}

$listHeight: 45px;

#Schedule {
  display: grid;
  grid-template-columns: 5% 95%;
  margin-top: auto;
  margin-bottom: auto;
  #HourList {
    li {
      z-index: 500;
      position: relative;
      height: $listHeight;
      border: 1px dashed rgba(0, 0, 0, 0.45);
      background-color: rgba(255, 255, 255, 0.45);
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
        background-color: rgba(255, 255, 255, 0.60);
        // background-color: transparent;
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
            width: 100%;
            height: 100%;
            cursor: default;
          }
        }
      }
    }
  }
}

.coverHalf {
  @extend .cover;
  color: rgb(255, 252, 80) !important;
  height: 50% !important;
  top: 50% !important;
}

.cover {
  width: 80% !important;
  z-index: 2000;
  left: 0;
  top: 0;
  position: absolute;
  color: white;
  background-color: rgba(255, 0, 0, 0.5);
  cursor: default;
  i {
    position: absolute;
    left: 10px;
    font-size: 25px;
    border-radius: 100%;
  }
  .bgCircle {
    position: absolute;
    left: 15px;
    border-radius: 100%;
    height: 15px !important;
    width: 15px !important;
    background-color: black;
  }
}

.coverTop {
  top: 0 !important;
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