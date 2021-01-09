<template>
  <div>
    <section id="Main" @contextmenu.prevent>

      <div id="ClassSelector" v-if="classes.length >= 1">
          <Select class="_Select" :options="classes" :style="{zIndex: 300}"  
          @optionSelected="fetchClassSchedule" :selType="'Class'"
          :widthFix="true"/>
           <!-- Week Type Toggler -->
          <button id="weekTypeToggler"
          :class="{unevenWeek: unevenWeek}">
            <span>{{ unevenWeek?
              'Ungerade Woche':
              'Gerade Woche' }}</span>
          </button>
      </div>

      <ul class="List Replacements">
        <li class="replacement" v-for="(rpl, i) in replacementTitles" :key="i"
         :style="{backgroundColor: `${replacementColors[i]}`}"
         :class="{selected: rpl === selectedRpl}"
         @click="selectRplType(i)">
          <span class="replacementItem">
            {{ rpl }}
          </span>
        </li>
      </ul>

      <!-- Info Message -->
      <div class="List" v-if="selectedRpl === 'Info'">
        <input id="infoMsgInput" v-model="infoMsg"
        placeholder="Info Nachricht eingeben..."
        v-focus>
      </div>

      <!-- Subject List -->
      <ul class="List" v-if="selectedRpl === 'Vertretung'">
        <li v-for="(subj, i) in selectable" :key="i"
        :style="{backgroundColor: chooseColor(i, 'List')}"
        :class="{selected: subj.selected}"
        @click="selectSubject(i)">
          <span class="selectable">
            <span class="teacherName">{{ subj.teacherName }}</span>
            <span class="subjName" :style="{backgroundColor: chooseColor(i, 'Subject')}">
              {{ subj.name.substring(0, 3) }}
            </span>
          </span>
        </li>
      </ul>

      <!-- Teacher List -->
      <ul class="List" v-if="selectedRpl === 'Betreuung'">
        <li v-for="(teacher, i) in teachers" :key="i"
        :style="{backgroundColor: chooseColor(i, 'List')}"
        :class="{selected: teacher.selected}"
        @click="selectTeacher(i)">
          <span class="selectable">
            <span class="teacherName teacherNamePaddingRight">
              {{ teacher.name }}
            </span>
          </span>
        </li>
      </ul>
      
      <RoomSelector id="_RoomSelector" @selected="addRpl(rplSelectedRoom.day, rplSelectedRoom.hour, rplSelectedRoom.coupler, $event)" 
      v-if="roomListActive"
      :day="rplSelectedRoom.day" :hour="rplSelectedRoom.hour"
      :rplSelectedRoom="rplSelectedRoom"/>

      <div id="Schedule" v-if="columnsNum >= 1">
        <!-- Hours -->
        <ul id="HourList">
          <li v-for="hourNum in columnsNum" :key="hourNum">
            <span>{{ `${hourNum}.` }}</span>
          </li>
        </ul>
        <ul id="Days">
          <li v-for="(n, day) in 5" :key="day">
            <span class="weekDayTitle">
              <span class="dayOfWeek">
                {{ weekDayTitles[n-1].toUpperCase().substring(0,3) }}. 
              </span>
              <span class="date">{{ returnDate(n) }}</span>
            </span>
            <ul id="Hours">
              <li v-for="(n, hour) in columnsNum" :key="hour">
                <div>
                  <!-- Entfall -->
                  <div class="cover" v-if="checkHasRpl(day, hour) === 'entfall'"
                  :class="{coverTop: couplers[day][hour]}"
                  @click.right="removeRpl(day, hour)">
                    <div class="bgCircle"></div>
                    <i class="fa fa-exclamation-circle"></i>
                    <span>Entfällt</span>
                  </div>
                  <!-- Info -->
                  <div class="info infoTop" v-if="checkHasRpl(day, hour) === 'info'"
                  @click="showInfo(day, hour)">
                    <div class="bgCircle"></div>
                    <i class="fa fa-exclamation-circle"></i>
                  </div>
                  <!-- Vertretung -->
                  <div class="rplIndicatorTop" v-if="checkHasRpl(day, hour) === 'vertretung'"></div>
                  <!-- Betreuung -->
                  <div class="betreuung" v-if="checkHasRpl(day, hour, false, 'Betreuung')"
                  :class="{coverTop: couplers[day][hour]}"
                  @click.right="removeRpl(day, hour)">
                    <span>{{ returnBetreuungTeacher(day, hour) }}</span>
                  </div>
                  <!-- Hour -->
                  <div class="items" v-if="hours[day][hour]"
                    :class="{coupledTop: couplers[day][hour]}"
                    :style="{backgroundColor: chooseScheduleColor(day, hour, false, 'List')}"
                    @click.left="addRpl(day, hour)"
                    @click.right="removeRpl(day, hour)">
                    <!-- Vertretung ohne Lehrer -->
                    <span v-if="checkHasRpl(day, hour) === 'vertr. ohne lehrer'">
                      Vertr. ohne Lehrer
                    </span>
                    <span class="hourTeacherName" v-else>
                      {{ adjustedTeacherName(day, hour) }}
                    </span>
                    <span class="hourSubjName" :style="{backgroundColor: chooseScheduleColor(day, hour, false, 'Subject')}">
                      {{ hours[day][hour].rplSubjName ?
                        hours[day][hour].rplSubjName.substring(0, 3):
                        hours[day][hour].name.substring(0, 3) }}
                    </span>
                  </div>
                  <div v-else class="fieldPlaceholder">
                    Frei
                  </div>
                  <div v-if="hours[day][hour]" class="room"
                    :class="{coupledTopRoom: couplers[day][hour]}"
                    :style="{backgroundColor: chooseScheduleColor(day, hour, false, 'List', true)}"
                    @click.left="selectRoom(day, hour, false, null)"
                    @click.right="removeRpl(day, hour, false, true)">
                    <!-- Raumänderung -->
                    <span v-if="checkHasRpl(day, hour, false, 'Raumänderung')">
                      <span class="roomRpl"></span>
                      {{ showRplRoom(day, hour, false) }}
                    </span>
                    <span v-else>
                      {{ 
                        hours[day][hour].room?
                        hours[day][hour].room.name:
                        '-' 
                      }}
                    </span>
                  </div>
                </div>

                <!-- Entfall -->
                 <div v-if="couplers[day][hour]">
                   <div class="cover coverBottom" v-if="checkHasRpl(day, hour, true) === 'entfall'"
                    @click.right="removeRpl(day, hour, true)">
                    <div class="bgCircle"></div>
                    <i class="fa fa-exclamation-circle"></i>
                    <span>Entfällt</span>
                  </div>
                  <!-- Info -->
                  <div class="info" v-if="checkHasRpl(day, hour, true) === 'info'"
                  @click="showInfo(day, hour, true)">
                    <div class="bgCircle"></div>
                    <i class="fa fa-exclamation-circle"></i>
                  </div>
                  <!-- Vertretung -->
                  <div class="rplIndicatorBottom" v-if="checkHasRpl(day, hour, true) === 'vertretung'"></div>
                   <!-- Betreuung -->
                  <div class="betreuung coverBottom borderHeightFix" v-if="checkHasRpl(day, hour, true) === 'betreuung'"
                  @click.right="removeRpl(day, hour, true)">
                    <span>{{ returnBetreuungTeacher(day, hour, true) }}</span>
                  </div>
                  <!-- Hour -->
                  <div class="items" v-if="hours[day][hour]"
                    :class="{coupledBottom: couplers[day][hour]}"
                    :style="{backgroundColor: chooseScheduleColor(day, hour, true, 'List')}"
                    @click.left="addRpl(day, hour, true)"
                    @click.right="removeRpl(day, hour, true)">
                    <!-- Vertretung ohne Lehrer -->
                    <span v-if="checkHasRpl(day, hour, true) === 'vertr. ohne lehrer'">
                      Vertr. ohne Lehrer
                    </span>
                    <span class="hourTeacherName" v-else>
                      {{ adjustedTeacherName(day, hour, true) }}
                    </span>
                    <span class="hourSubjName" :style="{backgroundColor: chooseScheduleColor(day, hour, true, 'Subject')}">
                       {{ couplers[day][hour].rplSubjName ?
                        couplers[day][hour].rplSubjName.substring(0, 3):
                        couplers[day][hour].name.substring(0, 3) }}
                    </span>
                  </div>
                  <div v-else class="fieldPlaceholder">
                    Frei
                  </div>
                  <div v-if="couplers[day][hour]" class="room" :class="{coupledBottomRoom: couplers[day][hour]}"
                    :style="{backgroundColor: chooseScheduleColor(day, hour, true, 'List', true)}"
                    @click.left="selectRoom(day, hour, true, null)"
                    @click.right="removeRpl(day, hour, true, true)">
                    <!-- Raumänderung -->
                    <span v-if="checkHasRpl(day, hour, true, 'Raumänderung')">
                      <span class="roomRpl"></span>
                      {{ showRplRoom(day, hour, true) }}
                    </span>
                    <span v-else>
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

      <div id="WeekChanger">
        <button @click="changeWeek('previous')">Woche davor</button>
        <button @click="changeWeek('next')">Nächste Woche</button>
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
  components: { Select, RoomSelector },
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
      unevenWeek: false,
      selectable: [],
      selectedSubj: null,
      selectedTeacher: null,
      replacementTitles: ['Entfall', 'Vertretung', 'Raumänderung', 'Info', 'Verlegung', 'Betreuung', 'Vertr. ohne Lehrer'],
      replacementColors: ['#F04720', '#A0DB43', '#40BFB8', '#D06CB2', '#5fc869', '#f5a742', '#2AA3DA'],
      selectedRpl: null,
      replacements: [],
      updateRequested: false,
      scheduleDates: [],
      weeksAway: 0,
      days: [],
      months: [],
      infoMsg: null,
      rooms: [],
      rplSelectedRoom: {
        day: null,
        hour: null,
        name: null,
        coupler: false,
        date: null
      },
      roomListActive: false,
      roomRpls: [],
      roomRplsForRemoval: [],
      infoRpls: [],
      rplsFetched: false
    }
  },
  methods: {
    ...mapActions([
      'fetchClasses',
      'fetchRooms'
    ]),
    showRplRoom(day, hour, coupler = false) {
      log('e',this.roomRpls)

      const roomIndex = this.roomRpls.findIndex(x =>
        x.hour === hour &&
        x.coupler === coupler &&
        x.date === `${this.days[day]}.${this.months[day]}.`
      )

      if (roomIndex !== -1) {
        return this.roomRpls[roomIndex].roomName
      }
    },
    selectRoom(day, hour, coupler = false) {
      if (this.selectedRpl === 'Raumänderung') {
        let room
        if (coupler) {
          room = this.couplers[day][hour].room
        } else {
          room = this.hours[day][hour].room
        }

        if (room) {
          if (room.name) {
            this.rplSelectedRoom.name = room.name
          }
        }

        this.rplSelectedRoom = {
          day,
          hour,
          coupler,
          date: `${this.days[day]}.${this.months[day]}.`
        }

        const roomIndex = this.roomRpls.findIndex(x =>
          x.hour == hour &&
          x.coupler == coupler &&
          x.date == `${this.days[day]}.${this.months[day]}.` &&
          x.rplType == 'Raumänderung'
        )

        if (roomIndex !== -1) {
          this.setInfo('Ein Raum wurde bereits zugewiesen. Bitte entfernen Sie erstens die alte Raumvertretung.', 'bad')
          throw new Error('Room already inserted, please remove room rpl first.')
        } else {
          this.roomListActive = true
          log('selected room:', this.rplSelectedRoom)
        }
      } else {
        this.setInfo('Um eine Raumänderung zu machen muss die Kategorie (oben) ausgewählt sein.', 'info')
      }
    },
    showInfo(day, hour, coupler = false) {
      const rplIndex = this.replacements.
        findIndex(
          x => x.day == day &&
          x.hour == hour &&
          x.coupler == coupler &&
          x.date == `${this.days[day]}.${this.months[day]}.`)

      log('show info', this.replacements[rplIndex])
      this.infoMsg = this.replacements[rplIndex].infoMsg
    },
    checkHasRpl(day, hour, coupler = false, rplTypeToCheck) {
      let rplIndex

      if (rplTypeToCheck) {
        if (rplTypeToCheck === 'Raumänderung') {
          rplIndex = this.roomRpls.findIndex(x => 
            x.day == day &&
            x.hour == hour &&
            x.coupler == coupler &&
            x.date == `${this.days[day]}.${this.months[day]}.` &&
            x.rplType == rplTypeToCheck)
        } else if (rplTypeToCheck === 'Info') {
           rplIndex = this.infoRpls.findIndex(x => 
            x.day == day &&
            x.hour == hour &&
            x.coupler == coupler &&
            x.date == `${this.days[day]}.${this.months[day]}.` &&
            x.rplType == rplTypeToCheck)
        } else {
          rplIndex = this.replacements.findIndex(x => 
            x.day == day &&
            x.hour == hour &&
            x.coupler == coupler &&
            x.date == `${this.days[day]}.${this.months[day]}.` &&
            x.rplType == rplTypeToCheck)
          }
      } else {
        rplIndex = this.replacements.
        findIndex(
          x => x.day == day &&
          x.hour == hour &&
          x.coupler == coupler &&
          x.date == `${this.days[day]}.${this.months[day]}.`)     
      }

      if (rplIndex != -1) {
        return this.replacements[rplIndex].rplType.toLowerCase()
      }
    },
    async addRpl(day, hour, coupler = false, room) {
      const rpl = this.selectedRpl
      const selSubj = this.selectedSubj
      const selTeacher = this.selectedTeacher

      log('adding, coupler:', coupler)

      log(rpl)

      if (rpl === 'Raumänderung') {
        log('received room', room)
        this.rooms = await this.fetchRooms()
      }

      if (rpl === 'Vertretung' && selSubj == null) {
        this.setInfo('Um eine Vertretung einzutragen muss ein Fach ausgewählt sein!')
        throw new Error('Not selected subject for rpl.')
      }

      if (rpl === 'Betreuung' && selTeacher == null) {
        this.setInfo('Um eine Betreuung einzutragen muss ein Lehrer ausgewählt sein!')
        throw new Error('Not selected teacher for rpl.')
      }

      let today = new Date()
      let _day = today.getDay() || 7
      if (_day !== 1) today.setHours(-24 * (_day - 1))

      const errorMessage = () => {
        this.setInfo('Vertretung kann nicht an ein vergangenes Datum gesetzt werden!')
        throw new Error('Cannot insert rpl into past.')
      }

      // If month is smaller
      if ((today.getMonth() + 1) > this.months[day]) {
        errorMessage()
      } 
      // If months is equal and today's day is smaller
      else if ((today.getMonth() + 1) == this.months[day] &&
      today.getDate() > this.days[day]) {
        errorMessage()
      } else if (rpl === 'Info' && this.infoMsg == null) {
        throw new Error('Info needs msg.')
      }

      const replacement = {
        day, hour, coupler,
        rplType: rpl,
        date: `${this.days[day]}.${this.months[day]}.`
      }

      // Check if rpl of any type already exists at this date and hour
      let rplIndex = this.replacements.findIndex(x =>
        x.day == replacement.day &&
        x.hour == replacement.hour &&
        x.coupler == replacement.coupler &&
        x.date == replacement.date &&
        x.rplType == rpl
      )

      let roomIndex
      if (rpl === 'Raumänderung') {
        roomIndex = this.rooms.findIndex(x => 
          x._id === room._id)
      }

      log('room index:', roomIndex)
      log('rpl index', rplIndex)

      if (rplIndex !== -1) {
        this.setInfo('Eine Vertretung wurde bereits eingesetzt.', 'bad')
        throw new Error('Eine Vertretung wurde bereits eingesetzt.')
      }
      
      if (rplIndex === -1) {
        switch (rpl) {
          case 'Verlegung!':
            // let vertretungForSchedule = cloneDeep(replacement)
            // vertretungForSchedule.teacherID = selSubj.teacherID
            // vertretungForSchedule.teacherName = selSubj.teacherName
            // vertretungForSchedule.subjName = selSubj.name
            // log('Vrtr. for Schedule', vertretungForSchedule)

            // // Push
            // this.replacements.push(vertretungForSchedule)

            // let vertretungForTeacher = cloneDeep(vertretungForSchedule)
            // // Push to Teacher
            // delete vertretungForTeacher.teacherID
            // delete vertretungForTeacher.teacherName
            // delete vertretungForTeacher.coupler

            // vertretungForTeacher.className = this.selectedClass.name

            // log('Vrtr. for Teacher', vertretungForTeacher)

            // // Selected Teacher
            // let insertedTeacherLoc = this.teachers.findIndex(x => x.teacherID === selSubj.teacherID)

            // this.teachers[insertedTeacherLoc].dynamicNotAvailable.push(cloneDeep(vertretungForTeacher))
            // this.teachers[insertedTeacherLoc].needsDBUpdate = true

            // // Teacher in Field
            // let fieldTeacherLoc
            // if (coupler) {
            //   fieldTeacherLoc = this.teachers.findIndex(x => x.teacherID == this.couplers[day][hour].teacherID)
            // } else {
            //   fieldTeacherLoc = this.teachers.findIndex(x => x.teacherID == this.hours[day][hour].teacherID)
            // }

            // this.teachers[fieldTeacherLoc].fallOffs.push(cloneDeep(vertretungForTeacher))
            // this.teachers[fieldTeacherLoc].needsDBUpdate = true
            
            // // Clear
            // this.selSubj = null
            break
          case 'Entfall':
            this.replacements.push(cloneDeep(replacement))
            this.teachers[teacherIndex].dynamicNotAvailable.push(cloneDeep(replacement))
            this.teachers[teacherIndex].needsDBUpdate = true
            break
          case 'Info':
            let info = cloneDeep(replacement)
            info.infoMsg = this.infoMsg
            // Push
            this.replacements.push(info)
            this.teachers[teacherIndex].dynamicNotAvailable.push(cloneDeep(info))
            this.teachers[teacherIndex].needsDBUpdate = true
            // Clear
            this.infoMsg = null
            break
          case 'Vertretung':
            let vertretungForSchedule = cloneDeep(replacement)
            vertretungForSchedule.teacherID = selSubj.teacherID
            vertretungForSchedule.teacherName = selSubj.teacherName
            vertretungForSchedule.subjName = selSubj.name
            log('Vrtr. for Schedule', vertretungForSchedule)

            // Push
            this.replacements.push(vertretungForSchedule)

            let vertretungForTeacher = cloneDeep(vertretungForSchedule)
            // Push to Teacher
            delete vertretungForTeacher.teacherID
            delete vertretungForTeacher.teacherName
            delete vertretungForTeacher.coupler

            vertretungForTeacher.className = this.selectedClass.name

            log('Vrtr. for Teacher', vertretungForTeacher)

            // Selected Teacher
            let insertedTeacherLoc = this.teachers.findIndex(x => x.teacherID === selSubj.teacherID)

            this.teachers[insertedTeacherLoc].dynamicNotAvailable.push(cloneDeep(vertretungForTeacher))
            this.teachers[insertedTeacherLoc].needsDBUpdate = true
            
            // delete vertretungForTeacher.subjName

            // Teacher in Field
            let fieldTeacherLoc
            if (coupler) {
              fieldTeacherLoc = this.teachers.findIndex(x => x.teacherID == this.couplers[day][hour].teacherID)
            } else {
              fieldTeacherLoc = this.teachers.findIndex(x => x.teacherID == this.hours[day][hour].teacherID)
            }

            this.teachers[fieldTeacherLoc].fallOffs.push(cloneDeep(vertretungForTeacher))
            this.teachers[fieldTeacherLoc].needsDBUpdate = true
            
            // Clear
            this.selSubj = null
            break
          case 'Betreuung':
            let betreuungForSchedule = cloneDeep(replacement)
            betreuungForSchedule.teacherID = selTeacher.teacherID
            betreuungForSchedule.teacherName = selTeacher.name
            log('Betreuung for Schedule', betreuungForSchedule)

            // Push
            this.replacements.push(betreuungForSchedule)

            let betreuungForTeacher = cloneDeep(betreuungForSchedule)
            // Push to Teacher
            delete betreuungForTeacher.teacherID
            delete betreuungForTeacher.teacherName
            delete betreuungForTeacher.coupler

            betreuungForTeacher.className = this.selectedClass.name

            log('Betreuung for Teacher', betreuungForTeacher)

            this.teachers[teacherIndex].dynamicNotAvailable.push(cloneDeep(betreuungForTeacher))
            this.teachers[teacherIndex].needsDBUpdate = true
            // Clear
            this.selSubj = null
            break
          case 'Vertr. ohne Lehrer':
            const vertrOhneLehrer = cloneDeep(replacement)

            this.replacements.push(vertrOhneLehrer)
          
            this.teachers[teacherIndex].dynamicNotAvailable.push(vertrOhneLehrer)
            this.teachers[teacherIndex].needsDBUpdate = true
            break
          case 'Raumänderung':
            log('roomchange')
            let roomChange = cloneDeep(replacement)
            roomChange.roomName = room.name
            roomChange.roomType = room.type

            this.roomRpls.push(roomChange)

            log('found room', this.rooms[roomIndex])
            this.rooms[roomIndex].dynamicTakenHours.push(roomChange)
            this.rooms[roomIndex].needsDBUpdate = true
          
            this.teachers[teacherIndex].dynamicRoomRpls.push(roomChange)
            this.teachers[teacherIndex].needsDBUpdate = true

            log('Room change:', roomChange)
            this.roomListActive = false

            break
        }
      }

      log(this.replacements)
      this.$store.commit('setUpdateRequested', true)
    },
    returnBetreuungTeacher(day, hour, coupler = false) {
      const rplIndex = this.replacements.findIndex(x =>
        x.day == day &&
        x.hour == hour &&
        x.coupler == coupler &&
        x.date == `${this.days[day]}.${this.months[day]}.` &&
        x.rplType == 'Betreuung'
      )

      log(this.replacements[rplIndex])

      if (rplIndex != -1) return this.replacements[rplIndex].teacherName
    },
    removeRpl(day, hour, coupler = false, removeRoom = false) {
      const date = `${this.days[day]}.${this.months[day]}.`

      if (removeRoom === true) {
        const roomIndex = this.roomRpls.findIndex(x =>
        x.hour === hour &&
        x.coupler === coupler &&
        x.date === `${this.days[day]}.${this.months[day]}.`)

        if (roomIndex !== -1) {
          this.roomRplsForRemoval.push(this.roomRpls[roomIndex])
          this.roomRpls.splice(roomIndex, 1)
        } else {
          this.setInfo('Diese Stunde hat keine Raumvertretung die entfernt werden kann.', 'bad')
          throw new Error('No RoomRPL found for removal.')
        }
      } else {
        const rplIndexForFindingRplType = this.replacements.findIndex(x => 
          x.day == day && x.hour == hour && x.coupler == coupler && x.date == date
        )

        if (rplIndexForFindingRplType === -1) {
          this.setInfo('Diese Stunde hat keine Vertretung die entfernt werden kann.', 'bad')
          throw new Error('No RPL found for removal.')
        }

        const rplType = this.replacements[rplIndexForFindingRplType].rplType

        if (rplType === 'Raumänderung') {
          throw new Error('Rpl type not found.')
        }

        const rplForRemoval = {day, hour, coupler, rplType, date}

        const rplIndex = this.replacements.findIndex(x => 
          x.day == rplForRemoval.day &&
          x.hour == rplForRemoval.hour &&
          x.coupler == rplForRemoval.coupler &&
          x.rplType == rplForRemoval.rplType &&
          x.date == rplForRemoval.date)
        
        let teacherIndex
        if (coupler) {
          teacherIndex = this.teachers.findIndex(x => x.teacherID == this.couplers[day][hour].teacherID)
        } else {
          teacherIndex = this.teachers.findIndex(x => x.teacherID == this.hours[day][hour].teacherID)
        }
        
        const teacherRplIndex = this.teachers[teacherIndex].dynamicNotAvailable.indexOf(rplForRemoval)

        log('replacements', this.replacements)
        log('rplForRemoval', rplForRemoval)
        // If replacement is in dB
        const replacementInDB = this.replacements.findIndex(x => 
          x.day == rplForRemoval.day && 
          x.hour == rplForRemoval.hour && 
          x.coupler == rplForRemoval.coupler && 
          x.rplType == rplForRemoval.rplType && 
          x.date == rplForRemoval.date)

        log('replacementInDB', replacementInDB)

        this.teachers[teacherIndex].dynamicNotAvailable.splice(teacherRplIndex, 1)
        this.teachers[teacherIndex].replacementIndexesForRemoval.push(rplForRemoval)
        this.teachers[teacherIndex].needsDBUpdate = true
        
        this.replacements.splice(rplIndex, 1)

        if (coupler) {
          this.couplers[day][hour].rplSubjName = null
        } else {
          this.hours[day][hour].rplSubjName = null
        }
      }

      this.$store.commit('setUpdateRequested', true)
    },
    selectRplType(i) {
      this.selectedRpl = this.replacementTitles[i]
    },
    selectTeacher(i) {
      this.teachers.forEach((subject) => {
        subject.selected = false
      })

      this.selectableReady = true

      this.teachers[i].selected = true // for CSS
      this.selectedTeacher = this.teachers[i] // for JS

      log(this.selectedTeacher)

      this.$forceUpdate()
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
    blockClickBeforeUpdate() {
      if (this.updateRequested) {
        this.$store.commit('setShakeButton', true)
      }
    },
    getRoomType(day, hour) { // Maybe instead just button to show the room type above schedule when clicked
      if (this.hours[day][hour].room) {
        if (this.hours[day][hour].room.type !== 'Normaler Raum') {
          return this.hours[day][hour].room.type
        }
      }
    },
    adjustedTeacherName(day, hour, coupler = false) {
      let name

      const rplIndex = this.replacements.
        findIndex(
          x => x.day == day &&
          x.hour == hour &&
          x.coupler == coupler &&
          x.date == `${this.days[day]}.${this.months[day]}.`)

      if (rplIndex != -1) {
        if (this.replacements[rplIndex].rplType === 'Vertretung') {
          name = this.replacements[rplIndex].teacherName.split(' ')

          const fname = name[0].charAt(0)
          const lname = name[name.length - 1]

          if (coupler) {
            this.couplers[day][hour].rplSubjName = this.replacements[rplIndex].subjName.substring(0, 3)
          } else {
            this.hours[day][hour].rplSubjName = this.replacements[rplIndex].subjName.substring(0, 3)
          }

          return `${fname}. ${lname}`
        }
      }

      if (coupler) {
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
    chooseScheduleColor(day, hour, coupler, type, isRoom = false) {
      const rplIndex = this.replacements.
        findIndex(
          x => x.day == day &&
          x.hour == hour &&
          x.coupler == coupler &&
          x.date == `${this.days[day]}.${this.months[day]}.`)

      let subjName
      if (rplIndex != -1 && this.replacements[rplIndex].rplType !== 'Info') {
        subjName = this.replacements[rplIndex].subjName
      } else {
        if (coupler) {
          subjName = this.couplers[day][hour].name
        } else {
          subjName = this.hours[day][hour].name
        }
      }

      const i = this.selectable.findIndex(x => x.name === subjName)
      
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

      if (!this.rplsFetched) {
         const classReplacements = await axios.post(`${config.domain}/fetch-class-replacements`, {
          classID: this.selectedClass._id
        })

        this.replacements = classReplacements.data.replacements
        this.roomRpls = classReplacements.data.roomRpls

        this.rplsFetched = true
      }

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
          name: subject.teacherName,
          teacherUname: subject.teacherUname,
          teacherID: subject.teacherID,
          staticNotAvailable: subject.staticNotAvailable,
          uw_staticNotAvailable: subject.uw_staticNotAvailable,
          dynamicRoomRpls: [],
          roomRplsForRemoval: [],
          dynamicInfoRpls: [],
          infoRplsForRemoval: [],
          dynamicNotAvailable: [],
          fallOffs: [],
          replacementIndexesForRemoval: [],
          selected: false,
          needsDBUpdate: false
        })
      })

      // Remove duplicates from Teachers
      const unique = new Set(this.teachers.map(e => JSON.stringify(e)));
      this.teachers = Array.from(unique).map(e => JSON.parse(e));
    },
    async updateReplacements() {
      let teachersForUpdate = []
      let roomsForUpdate = []

      this.teachers.forEach(teacher => {
        if (teacher.needsDBUpdate) {
          teacher.dynamicNotAvailable = _.uniq(teacher.dynamicNotAvailable)
          teacher.replacementIndexesForRemoval = _.uniq(teacher.replacementIndexesForRemoval)

          log(teacher)

          let optimizedTeacher = cloneDeep(teacher)

          delete optimizedTeacher.teacherUname
          delete optimizedTeacher.staticNotAvailable
          delete optimizedTeacher.uw_staticNotAvailable
          delete optimizedTeacher.needsDBUpdate

          teachersForUpdate.push(teacher)
        }
      })

      this.rooms.forEach(room => {
        if (room.needsDBUpdate) {
          room.dynamicTakenHours = _.uniq(room.dynamicTakenHours)
          room.replacementIndexesForRemoval = _.uniq(room.replacementIndexesForRemoval)

          roomsForUpdate.push(room)
        }
      })

      let response = await axios.post(`${config.domain}/update-class-replacements`, {
        classID: this.selectedClass._id,
        replacements: this.replacements,
        roomRpls: this.roomRpls,
        infoRpls: this.infoRpls,
        teachersForUpdate: teachersForUpdate,
        roomsForUpdate: roomsForUpdate
      })

      this.teachers.forEach(teacher => {
        if (teacher.needsDBUpdate) {
          teacher.needsDBUpdate = false
          teacher.dynamicNotAvailable = []
          teacher.replacementIndexesForRemoval = []
        }
      })

      this.rooms.forEach(rooms => {
        if (rooms.needsDBUpdate) {
          rooms.needsDBUpdate = false
          rooms.dynamicTakenHours = []
          rooms.replacementIndexesForRemoval = []
        }
      })

      log(response)
    },
    returnDate(n) {
      return `${this.days[n-1]}.${this.months[n-1]}.`
    },
    changeWeek(x) {
      if (x === 'previous') {
        --this.weeksAway
      } else if (x === 'next') {
        this.weeksAway++
      }
      
      this.fetchScheduleDates()

      if (this.selectedClass) {
        this.fetchClassSchedule(this.selectedClass)
      }
    },
    fetchScheduleDates() {
      let today = new Date()
      today.setDate(today.getDate() + (this.weeksAway * 7))

      for(let i = 1; i < 6; i++) {
        let day = today.getDay() || 7 // Get current day number, converting Sun. to 7
        if (day !== i) today.setHours(-24 * (day - i))

        this.days[i-1] = today.getDate()
        this.months[i-1] = today.getMonth() + 1
      }

      // Set if Even or Uneven Week
      const weekNum = today.getWeekNumber()
      if (weekNum % 2 === 0) {
        this.unevenWeek = false
      } else {
        this.unevenWeek = true
      }

      this.$forceUpdate()

      console.table(this.days)
      console.table(this.months)
    }
  },
  async created() {
    // Getting Week Number setup
    Date.prototype.getWeekNumber = function(){
      var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
      var dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
    }

    this.fetchScheduleDates()

    this.$store.subscribe(async(mutation, state) => {
      if (mutation.type === 'setClasses') {
        this.classes = state.classes
      }

      if (mutation.type === 'setUpdateRunning') {
        if (state.updateRunning) {
          this.updateReplacements()
        }
      }

      if (mutation.type === 'setUpdateRequested') {
        this.updateRequested = state.updateRequested
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
@import '@/includes/scss/centerY';
@import '@/includes/scss/centerXY';
@import '@/includes/scss/flexCenter';

.roomRpl {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: red;
  border: 1px solid black;
  top: 0; right: 0;
}

#_RoomSelector {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 2000;
}

.teacherNamePaddingRight {
  padding-right: 15px;
}

#infoMsgInput {
  width: calc(100% - 12px);
  border-radius: 5px;
  padding: 5px 0 5px 10px;
  color: #f0f0f0;
  background-color: rgba(147, 156, 185, 0.3);
  font-weight: bold;
  transition: .15s ease-in-out;
}

#infoMsgInput::placeholder {
  color: #f0f0f0;
}

.Replacements {
  background-color: rgba(255, 255, 255, 0.7) !important;
}

li.replacement {
  text-align: center !important;
  padding: 5px 10px 5px 10px !important;
  border: 1px solid black;
  .replacementItem {
    color: white !important;
    padding: 0 !important;
  }
}

.List {
  margin-top: auto;
  margin-bottom: auto;
  margin-top: 20px;
  width: 95%;
  display: inline-block;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.6);
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
  span.subjName {
    background-color: rgb(70, 68, 68) !important;
  }
}

span.selectable {
  color: whitesmoke;
}

.unevenWeek {
  background-color: rgb(47, 189, 255) !important;
}

.weekDayTitle {
  @include centerX;
  width: 95%;
  top: -45px;
  color: #f9f9f9;
  font-weight: bold;
  background-color: rgba(255, 255, 255, 0.15);
  padding: 5px 0 5px 0;
  border-radius: 4px;
  border-bottom: 2px solid black;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  span.dayOfWeek {
    font-size: 14px;
  }
  span.date {
    background-color: sandybrown;
    padding: 3px;
    border-radius: 4px;
    color: darkslategray;
    font-size: 13px;
  }
}

#ClassSelector {
  @include flexCenter;
  margin-top: 20px;
  ._Select {
    width: 200px;
    margin-right: 20px;
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
  }
}

$listHeight: 45px;

#Schedule {
  @include flexCenter;
  margin: auto;
  margin-top: 120px;
  display: grid;
  grid-template-columns: 5% 95%;
  width: 95%;
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
            cursor: pointer;
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

@mixin rplIndicator {
  z-index: 5000;
  position: absolute;
  left: 0px;
  height: 10px !important;
  width: 10px !important;
  border: 2px solid black;
  background-color: rgb(41, 255, 59) !important;
  box-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.4);
}

.rplIndicatorTop {
  @include rplIndicator;
  top: 0px;
}

.rplIndicatorBottom {
  @include rplIndicator;
  bottom: 4px;
}

#WeekChanger {
  button {
    margin-top: 15px;
    padding: 5px 10px 5px 10px;
    border-radius: 4px;
    font-weight: bold;
    outline: none;
    border: 1px solid black;
    transition: .25s ease;
    &:hover {
      transform: scale(1.05);
    }
    &:nth-child(1) {
      background-color: #fbc687;
    }
    &:nth-child(2) {
      margin-left: 10px;
      background-color: #ea907a;
    }
  }
}

.cover {
  width: 100% !important;
  z-index: 2000;
  left: 0;
  top: 0;
  position: absolute;
  color: white;
  background-color: red;
  cursor: default;
  span {
    font-weight: bold;
  }
}

.betreuung {
  width: 80% !important;
  z-index: 2000;
  left: 0;
  top: 0;
  height: calc(100% - 4px) !important;
  position: absolute;
  color: white;
  border: 2px dashed rgba(0, 0, 0, 0.3);
  background-color: rgb(19, 197, 188);
  cursor: default;
  span {
    font-weight: bold;
  }
}

.info {
  position: absolute;
  height: 50% !important;
  z-index: 2000;
  left: 0;
  width: 20px !important;
  height: 20px !important;
  bottom: 0 !important;
  border-radius: 100%;
  color: yellow !important;
  cursor: default;
  transition: .15s ease;
  &:hover {
    color: orange !important; 
    transform: scale(1.05);
  }
  .bgCircle {
    @include centerXY;
  }
  i {
    @include centerXY;
    cursor: pointer;
    transition: .15s ease;
  }
}

.infoTop {
  top: 0 !important;
}

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

.coverTop {
  position: absolute;
  top: 0 !important;
  height: 45% !important;
}

.coverBottom {
  position: absolute;
  top: calc(50% + 1px) !important;
  height: 45% !important;
}

.borderHeightFix {
  height: calc(45% - 4px) !important;
}

</style>