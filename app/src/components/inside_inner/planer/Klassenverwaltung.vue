<template>
  <div>
    <div id="con">
      <!-- Add Class -->
      <section id="ClassAdder">

        <!-- Class Name Show/Edit -->
        <div id="adder_className">
          <input v-model="newClass.name" 
          placeholder="Klassenbezeichnung" autofocus>
        </div>
        
        <!-- Select Year -->
        <div id="adder_selectYear">
          <Select class="_Select" :options="years" :style="{zIndex: 300}"  
          @optionSelected="setNewClassYear" :selType="'Default'"/>
        </div>
        <!-- Select HalfYear -->
        <div id="adder_selectHalfYear">
          <Select class="_Select" :style="{zIndex: + 300}" :options="['1. Halbjahr', '2. Halbjahr']"
          @optionSelected="setNewClassHalfYear" :selType="'Default'"/>
        </div>
       
       <div id="addClass">
         <button @click="addClass()">
           <span>Klasse hinzufügen</span>
           <i id="add" class="fas fa-arrow-alt-circle-right"></i>
         </button>
       </div>

      </section>

      <!-- Class List -->
      <ul id="ClassList">
        <li class="Class" v-for="(_class, c) in classes" :key="c">

          <div class="ClassMain">
            <!-- Change Class Name -->
            <span class="className" :style="{backgroundColor: getBgColor(c)}">
              {{ _class.name }}
            </span>
            <!-- Select Year -->
            <span class="classYears">{{ _class.year }}</span>
            <!-- Select HalfYear -->
            <span class="classYears">{{ `${_class.halfYear}. Halbjahr` }}</span>

            <!-- Select Class Teacher -->
            <Select :style="{zIndex: + 20 - c}" :options="teachers"
            :classTeacher="{
              username: _class.classTeacherUname, 
              teacherID: _class.classTeacherID
            }"
            :selType="'Teacher'"/>
            <!-- Show Entire Class Data -->
            <button class="toggleClassDetails" @click="toggleClassDetails(c)"
            :class="{buttonForIconOpen: _class.detailsShown}">
              <i class="fas fa-angle-double-down" :class="{iconOpen: _class.detailsShown}"></i>
            </button>
          </div>

          <!-- Class Details -->
          <div class="ClassDetails" v-if="classes[c].detailsShown">

            <div class="Subjects">
              <!-- Subject Adder -->
              <div class="SubjectAdder" :style="{zIndex: + 20 - c}">
                <keep-alive>
                  <Select :options="filteredSubjects(c)" 
                  :selType="'Subject'"
                  @optionSelected="addSubjectToClass($event, c)"/>
                </keep-alive>
              </div>
              <!-- Subject List -->
              <ul class="SubjectList">
                <li v-if="!_class.assignedSubjects">
                  Keine Fächer zugewiesen
                </li>
                <li class="Subject" v-else v-for="(subject, i) in _class.assignedSubjects" :key="i">
                  <div class="subjectText">
                    <span>{{ subject.teacherUname }}</span>
                    <span>{{ subject.name.substring(0, 3) }}</span>
                  </div>
                  <i class="fas fa-minus-circle" @click="removeSubjectFromClass(c, subject._id)"></i>
                </li>
              </ul>
            </div>

            <div class="Students">
              <!-- Student Adder -->
              <div class="StudentAdder">
                <div id="inputContainer">
                  <input v-model="studentForPush" @keyup.enter="pushStudent()"
                  placeholder="Schüler Vor- und Nachname (mit Enter bestätigen)">
                  <ul>
                    <li class="tag" v-for="(student, o) in studentsForPush" :key="o">
                      <span>{{ student }}</span>
                      <i class="fas fa-minus-circle" @click="removeStudentFromPush(o)"></i>
                    </li>
                  </ul>
                </div>
                <button id="downButton" @click="pushToDB(_class._id)" v-if="studentsNotEmpty">
                  <div>
                    <span v-if="!multipleAccountsForPush">Konto anlegen</span>
                    <span v-else>Konten anlegen</span>
                  </div>
                  <LoadingIcon id="LoadingIcon" v-if="pushPending" />
                </button>
              </div>
              <!-- Student List -->
              <ul class="StudentList">
                <div v-if="_class.assignedStudents.length < 1">
                  <li class="noStudentsFound">
                    <span>Keine Schüler Konten gefunden</span>
                  </li>
                </div>
                <div v-else>
                  <li class="student" v-for="(student, s) in _class.assignedStudents" :key="s">
                    <span>{{ `${student.name} (${student.username})` }}</span>
                    <i class="fas fa-archive" @click="archiveStudent(student._id)"
                    :class="{iconArchived: student.archived}"></i>
                  </li>
                </div>
              </ul>
            </div>

          </div>
        </li>
      </ul>

    </div>
  </div>
</template>

<script>
import LoadingIcon from '@/components/global/LoadingIcon'
import Select from '@/components/global/Select'
import axios from 'axios'
import { mapActions } from 'vuex'
import config from '@/includes/js/config'
const log = console.log

export default {
  name: 'Klassenverwaltung',
  components: { Select },
  data() {
    return {
      years: [new Date().getFullYear(), new Date().getFullYear()+1],
      newClass: {
        name: null,
        year: new Date().getFullYear(),
        halfYear: '1',
        detailsShown: false
      },
      subjAdderA: false,
      classes: [],
      teachers: [],
      subjects: [],
      studentForPush: null,
      studentsForPush: [],
      pushPending: false,
      classBgColors: ['#ea4c89', '#24bcd6', '#32c766', '#f48024', '#f0e10e']
    }
  },
  computed: {
    dropdownArrow() {
      return require('@/assets/icons/profile_arrow.svg')
    },
    studentsNotEmpty() {
      if (this.studentsForPush.length > 0) return true
      else return false
    },
    multipleAccountsForPush() {
      if (this.studentsForPush.length > 1) return true
      else return false
    }
  },
  async created() {
    this.teachers = await this.$store.dispatch('fetchTeachers')

    this.teachers.forEach((teacher) => {
      if (teacher.subjects.length > 0) {
        teacher.subjects.forEach((subject) => {
          let subjectObject = {
            ...subject,
            teacherID: teacher._id,
            teacherName: teacher.name
          }

          this.subjects.unshift(subjectObject)
        })
      }
    })

    this.classes = await this.fetchClasses()

    this.subjects = await this.fetchSubjects()
  },
  methods: {
    ...mapActions([
      'fetchClasses',
      'fetchSubjects'
    ]),
    async removeSubjectFromClass(i, subjectID) {
      const response = await axios.patch(`${config.domain}/remove-subject-from-class`, {
        classID: this.classes[i]._id,
        subjectID
      })

      if (response.status === 200) {
        this.setInfo('Fach entfernt!', 'good')

        let filteredSubjects = []
        this.classes[i].assignedSubjects.forEach(subject => {
          if (subject._id != subjectID) {
            filteredSubjects.push(subject)
          }
        })

        this.classes[i].assignedSubjects = filteredSubjects

      } else {
        this.setInfo('Fehler. Bitte versuchen Sie es erneut.', 'bad')
      }
    },
    async archiveStudent(studentID) {
      const response = await axios.patch(`${config.domain}/archive-student`, {studentID})

      if (response.status === 200) {
        this.setInfo('Schüler archiviert!', 'good')
      } else {
        this.setInfo('Fehler. Bitte versuchen Sie es erneut.', 'bad')
      }
    },
    adjustedTeacherName(subject) {
      const name = subject.teacherName.split(' ')
      const fname = name[0].charAt(0)
      const lname = name[name.length - 1]

      return `${fname}. ${lname}`
    },
    getBgColor(i) {
      const timesBigger = i / this.classBgColors.length
      const result = i - (Math.floor(timesBigger) * this.classBgColors.length)

      return this.classBgColors[result]
    },
    setNewClassYear(val) {
      this.newClass.year = val
    },
    setNewClassHalfYear(val) {
      this.newClass.halfYear = val
    },
    toggleClassDetails(i) {
      this.classes[i].detailsShown = !this.classes[i].detailsShown
      this.$forceUpdate()
    },
    pushStudent() {
      this.studentsForPush.push(this.studentForPush)

      this.studentForPush = null
    },
    removeStudentFromPush(o) {
      this.studentsForPush.splice(o, 1)
    },
    async pushToDB(classID) {
      this.pushPending = true

      const response = await axios.post(`${config.domain}/create-student-accounts`, {
        classID,
        students: this.studentsForPush
      })

      this.pushPending = false

      if (response.status === 200) {
        this.teachers = []
        const receivedStudents = response.data
        // this.$store.commit('addTeachers', receivedTeachers)
        this.inputsActive = false
        // // const gotTeachers = this.$store.getters.getDBTeachers
      }
    },
    async addSubjectToClass(subject, classIndex) {
      const data = {
        subject,
        classID: this.classes[classIndex]._id
      }

      const res = await axios.patch(`${config.domain}/assign-subject-to-class`, data)

      if (res.status === 200) {
        this.classes[classIndex].assignedSubjects.push(subject)
      }
    },
    filteredSubjects(c) {
      let filtered = []
      
      if (this.classes[c].assignedSubjects.length > 0) {

        let assignedSubjectIDs = []
        this.classes[c].assignedSubjects.forEach((assignedSubject) => {
          assignedSubjectIDs.push(assignedSubject._id)
        })

        this.subjects.forEach(subject => {
          if (!assignedSubjectIDs.includes(subject._id)) {
            filtered.push(subject)
          }
        })
        
        return filtered
      } else {
        return this.subjects
      }
    },
    toggleSubjectAdder() {
      this.subjAdderA = !this.subjAdderA
    },
    setInfo(msg, type) {
      const infoPayload = { msg, type }
      this.$store.commit('setUpdateInfoMsg', infoPayload)
    },
    async addClass() {
      // No newClass.name Error
      if (this.newClass.name === null || this.newClass.name === '') {
        this.setInfo('Bitte geben Sie eine Klassenbezeichnung ein.', 'bad')
        throw new Error('No newClass.name detected')
      }
      const data = {
        name: this.newClass.name,
        year: this.newClass.year,
        halfYear: this.newClass.halfYear
      }

      const res = await axios.post(`${config.domain}/create-class`, data)
      
      if (res.status === 200) {
        this.setInfo('Klasse erstellt', 'good')

        const newObject = {
          _id: res.data,
          name: this.newClass.name,
          year: this.newClass.year,
          halfYear: this.newClass.halfYear,
          assignedSubjects: [],
          assignedStudents: []
        }

        this.classes.push(newObject)
        this.newClass.name = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/includes/scss/centerX';
@import '@/includes/scss/centerY';
@import '@/includes/scss/centerXY';
@import '@/includes/scss/flexCenter';
@import '@/includes/scss/flexCenterY';

.iconArchived {
  background-color: yellow !important;
}

li.noStudentsFound {
  @include flexCenter;
  color: #f0f0f0;
  background-color: rgba(255, 255, 255, 0.2);
  width: 80%;
  margin-left: auto;
  margin-right: auto;
  padding: 5px;
}

.iconOpen {
  transform: rotate(200deg) scale(1.2) !important;
}

.buttonForIconOpen {
  background-color: #f0f0f0 !important;
}

ul.StudentList {
  padding-bottom: 15px;
  div {
    li.student {
      position: relative;
      margin-left: auto;
      margin-right: auto;
      @include flexCenter;
      background-color: white;
      border-bottom: 1px solid rgba(0, 0, 0, 0.3);
      padding: 5px;
      width: 80%;
      i {
        color: rgba(0, 0, 0, 0.5);
        position: absolute;
        border: 1px solid rgba(0, 0, 0, 0.3);
        background-color: tomato;
        padding: 4px;
        border-radius: 2px;
        margin-left: 20px;
        right: 10px;
        cursor: pointer;
        &:hover {
          color: rgba(0, 0, 0, 0.7);
        }
      }
    }
  }
}

div#inputContainer {
  overflow-y: auto;
  max-height: 50%;
  border: 1px solid rgba(0, 0, 0, 0.3);
  min-width: 100%;
  padding: 5px 0 5px 0;
  float: left;
  border-bottom-right-radius: 5px;
  border-bottom-left-radius: 5px;
  background-color: rgb(69, 94, 128);
  box-shadow: 1px 2px 6px 2px rgba(0, 0, 0, 0.1);
  cursor: text;
  ul {
    margin-top: 5px;
    float: left;
    margin-right: 10px;
    li.tag {
      display: inline-block;
      background-color:  #ffffff;
      font-weight: bold;
      color: rgb(58, 51, 51);
      margin-left: 5px;
      padding: 5px 5px 5px 5px;
      border-radius: 6px;
      border: 1px solid rgba(0, 0, 0, 0.3);
      transition: .20s ease;
      cursor: default;
      &:hover {
        transform: scale(1.05);
        box-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.2);
      }
      i {
        color: tomato;
        margin: 0 3px 0 3px;
        cursor: pointer;
        &:hover {
          color: red;
        }
      }
    }
  }
  input {
    color: #f0f0f0;
    background-color: rgb(69, 94, 128);
    position: relative;
    padding: 10px 5px 10px 15px;
    transition: 1s ease;
    border: none;
    font-size: 17px;
    width: 390px;
    float: left;
    &:focus {
      outline: none;
    }
  }
  input::placeholder {
    color: rgba(255, 255, 255, 0.7)
  }
}

#downButton {
  margin-top: 10px;
  margin-left: 10px;
  padding: 7px 12px 7px 12px;
  border: none;
  min-width: 130px;
  max-height: 40px;
  background-color: rgb(22, 175, 22);
  border-radius: 4px;
  font-size: 16px;
  color: white;
  box-shadow: 1px 2px 6px 2px rgba(0, 0, 0, 0.3);
  transition: .2s ease;
  &:hover {
    transform: scale(1.02);
  }
}

@mixin KlassenbezeichnungInput($height, $width) {
  @include flexCenter;
  font-size: 19px;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
  // padding: 10px;
  width: $width; 
  height: $height;
  max-width: 95%;
  max-height: 95%;
  outline: none;
  border-radius: 3px;
  border: none;
  background-color: #f0f0f0;
  caret-color: rgb(28, 194, 97);
  box-shadow: 1px 1px 2px 3px rgba(0, 0, 0, 0.1);
  &::placeholder {
    padding: 0;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.3);
  }
}

._Select {
  width: 100%;
  max-width: 200px;
}

section#ClassAdder {
  display: grid;
  grid-template-columns: 1fr .5fr 1fr 1fr;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgb(87, 90, 136);
  div#adder_className {
     input {
      @include KlassenbezeichnungInput(45px, 170px);
    }
  }
  button {
    outline: none;
    background-color: rgb(28, 194, 97);
    border: none;
    padding: 5px 10px 5px 10px;
    border-radius: 3px;
    font-weight: bold;
    height: 30px;
    transition: .15s ease;
    &:hover {
      transform: scale(1.05)
    }
  }
  div {
    position: relative;
    display: flex; 
    justify-content:center;
    align-items: center;
  }
}

.Subjects {
  display: grid;
  grid-template-columns: 2fr 5fr;
  padding: 7px;
  ul.SubjectList {
    li.Subject {
      margin-left: 3px;
      margin-top: 3px;
      float: left;
      color: #f0f0f0;
      border: 1px solid rgba(0, 0, 0, 0.1);
      background-color: #305790;
      display: grid;
      grid-template-columns: 6fr 1fr;
      padding: 4px;
      transition: .25s ease;
      &:hover {
        transform: scale(1.05);
        box-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.5);
      }
      div.subjectText {
        span:nth-child(2) {
          margin-left: 7px;
          padding: 2px 5px 2px 5px;
          border-radius: 3px;
          background-color: rgb(56, 155, 180);
        }
      }
      i {
        color: tomato;
        margin: 0 3px 0 4px;
        cursor: pointer;
        &:hover {
          color: red;
        }
      }
    }
  }
}

.selectedItem {
  margin-left: auto;
  margin-right: auto;
  position: relative;
  display:table;
  width: 90%;
  height: 30px;
  border: none;
  border-bottom: 3px solid rgba(0, 0, 0, 0.3);
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  background-color: bisque;
  cursor: pointer;
  &:hover {
    background-color: rgba(0, 0, 0, 0.2);
  }
  span, img {
    display:table-cell;
    vertical-align:middle;
  }
  .dropdownArrow {
    @include centerY;
    margin-left: -30px;
    height: 15px;
  }
}

.subjectName {
  background-color: lime !important;
}

::-webkit-scrollbar {
  width: 0px;  /* Remove scrollbar space */
  background: transparent;  /* Optional: just make scrollbar invisible */
}

ul#ClassList {
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-top: none !important;
  max-height: 600px;
  overflow-y: auto;
  li.Class {
    display: grid;
    grid-template-rows: 40px 90%;
    .ClassMain {
      @include flexCenterY;
      display: grid;
      grid-template-columns: 150px .5fr 140px 1fr .2fr;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background-color: rgb(58, 58, 58);
      span.className {
        @include KlassenbezeichnungInput(30px, 120px);
        color: rgba(0, 0, 0, 0.6) !important;
      }
      span.classYears {
        color: white;
        background-color: rgba(255, 255, 255, 0.1);
        padding: 2px;
        display: inline-block;
        width: 80%;
        height: 20px;
      }
    }
    .ClassDetails {
      width: 100%;
      background-color: rgb(39, 42, 47);
      display: block;
      margin-left: auto;
      margin-right: auto;
      margin-top: 5px;
    }
  }
}

.toggleClassDetails {
  background-color: rgb(66, 142, 212);
  height: 100%;
  width: 100%;
  outline: none;
  transition: .5s ease;
  i {
    transition: .5s ease;
    transform: scale(1.2);
  }
}

div#con {
  @include centerXY;
  display: grid;
  grid-template-rows: 60px;
  width: 80%;
  max-width: 1000px;
}

#add {
  transform: scale(1.3);
  padding-left: 5px;
}

</style>