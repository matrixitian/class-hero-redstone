<template>
  <div>

    <div id="Centerer">
      <div class="Creator">
        <!-- Teacher Name Input -->
        <input v-model="tempTeacherName" @keyup.enter="addTeacher()"
        type="text" placeholder="Lehrer Vor- und Nachname">
        <!-- Teacher Adder Button -->
        <div @click="addTeacher()">
          <i id="btnAdd" class="fas fa-angle-double-right"></i>
        </div>
      </div>

      <ul id="TeacherList">
        <li v-for="(t, i) in teachers" :key="i">
          <!-- Name -->
          <div class="Naming" :class="{enableNameGrid: !t.local}">
            <span class="name" :class="{teacherArchived: t.archived}">
              {{ t.name }}
            </span>
            <!-- Username -->
            <span class="uname" v-if="!t.local"
            :class="{teacherUnameArchived: t.archived}">
              {{ t.archived?
                `${t.username} (archiviert)`:
                `${t.username}`
              }}
            </span>
          </div>
          <!-- Icons -->
          <i v-if="t.local" class="local fas fa-trash" @click="removeTeacherFromPush(i)"></i>
            <!-- Archive -->
          <i v-else class="fas fa-archive" 
          :class="{archivedIconColor: t.archived}" 
          @click="archiveTeacher(t)"></i>
            <!-- Show Subjects -->
          <i v-if="!t.local && !t.archived" class="showSubjects fas fa-angle-double-down"
          @click="toggleSubjsVisibility(i)"
          :class="{subjsIconRotation: t.showSubjects}"></i>

          <ul id="Subjects" v-if="!t.local && t.showSubjects && !t.archived">

            <!-- Subject Creator -->
            <div class="Creator Subjects">
              <!-- Subject Name Input -->
              <input v-model="tempSubjects[i]" @keyup.enter="addSubject(t, i)"
              type="text" placeholder="Fach Name">
              <!-- Subject Adder Button -->
              <div @click="addSubject(t, i)">
                <i id="btnAdd" class="fas fa-angle-double-right"></i>
              </div>
            </div>

            <!-- Subject List -->
            <div v-if="t.subjects">
              <li class="Subject" v-for="(subj, s) in t.subjects" :key="s"
              :style="{backgroundColor: `${subjColors[s]}`}">
                <!-- Subject name -->
                <span>{{ subj.name }}</span>
                <!-- Delete Local Subjects -->
                <i v-if="subj.local" class="local fas fa-trash"
                @click="removeSubjectFromPush(i, s)"></i>
                <!-- Subject saved in database Indicator -->
                <i v-else class="fas fa-check-circle"></i>
              </li>
            </div>
            
          </ul>
        </li>
      </ul>
    </div>
    
  </div>
</template>

<script>
import axios from 'axios'
import config from '@/includes/js/config'
import sortByName from '@/includes/js/sortByName'
const log = console.log

export default {
  name: 'Lehrerverwaltung',
  data() {
    return {
      tempTeacherName: '',
      teachers: [],
      tempSubjects: [],
      subjsForDBCreation: [],
      pushedTeachersCounter: 1,
      subjColors: ['#F04720', '#A0DB43', '#40BFB8', '#D06CB2', '#5fc869', '#f5a742', '#2AA3DA']
    }
  },
  created() {
    this.user = localStorage.getItem('user')
    this.fetchData()

    // Update Watcher
    this.$store.subscribe(async(mutation, state) => {
      if (mutation.type === 'setUpdateRunning') {
        if (state.updateRunning) {
          this.pushToDB()
        }
      }
    })
  },
  methods: {
    setErrOrInfo(msg, type) {
      const payload = {
        msg, type
      }

      this.$store.commit('setInfo', payload)

      throw new Error('Unarchivation not possible.')
    },
    // Others
    toggleSubjsVisibility(i) {
      this.teachers[i].showSubjects = !this.teachers[i].showSubjects
      this.$forceUpdate()
    },
    hideUpdateButtonIfNoPushesPending() {
      // Check if any local Teachers are awaiting update
      let index = this.teachers.findIndex(x => x.local === true)

      if (index === -1) {
        this.teachers.forEach(t => {
          // Check if any local Subjects are awaiting update
          t.subjects.forEach(subj => {
            index = t.subjects.findIndex(x => x.local === true)
          })
        })

        // Check if any archived Teachers are awaiting update
        if (index === -1) {
          let index = this.teachers.findIndex(x => x.archived === true)
        }
      }

      if (index === -1) {
        this.$store.commit('setUpdateRequested', false)
      }
    },
    removalPeriodActive() {
      const date = new Date()

      const currDay = date.getDate()
      const currMonth = date.getMonth() + 1
      const currYear = date.getFullYear()

      const dateFrom = `01/07/${currYear}`;
      const dateTo = `01/08/${currYear}`;
      const dateCheck = `${currDay}/${currMonth}/${currYear}`;

      const d1 = dateFrom.split("/");
      const d2 = dateTo.split("/");
      const c = dateCheck.split("/");

      const from = new Date(d1[2], parseInt(d1[1])-1, d1[0]);  // -1 because months are from 0 to 11
      const to = new Date(d2[2], parseInt(d2[1])-1, d2[0]);
      const check = new Date(c[2], parseInt(c[1])-1, c[0]);

      return check >= from && check <= to
    },
    sortTeachers() {
      log('Sorting...')
      let activeTeachers = []
      let archivedTeachers = []
      // Divide active and archived Teachers
      this.teachers.forEach(t => {
        if (t.archived) archivedTeachers.push(t)
        else activeTeachers.push(t)
      })

      // Sort teacher array by last name
      activeTeachers = sortByName(activeTeachers)
      archivedTeachers = sortByName(archivedTeachers)

      this.teachers = []

      this.teachers.push(...activeTeachers)
      this.teachers.push(...archivedTeachers)

      // Clear memory
      archivedTeachers = null
      activeTeachers = null
    },
    // Teacher Funcs
    addTeacher() {
      if (!this.tempTeacherName || !this.tempTeacherName.includes(' ')) {
        this.setErrOrInfo('Name sollte z. B. im Format "Alex Becker" sein.', 'bad')
      }

      this.teachers.unshift({
        name: this.tempTeacherName,
        username: null,
        local: true,
        counterID: this.pushedTeachersCounter,
        subjects: [],
        archivedInDB: false
      })
      this.pushedTeachersCounter++

      this.tempTeacherName = null

      this.$store.commit('setUpdateRequested', true)
    }, 
    removeTeacherFromPush(o) {
      this.teachers.splice(o, 1)

      this.hideUpdateButtonIfNoPushesPending()
    },
    archiveTeacher(teacher, i) {
      if (this.removalPeriodActive() === false) {
        this.setErrOrInfo('Lehrer können nur vom 1. July - 1. August archiviert werden!', 'info')
      }

      if (teacher.archived) {
        if (teacher.archivedInDB) {
          this.setErrOrInfo('Archivierte Lehrer können nicht ins System zurückgebracht werden.')
        }

        teacher.archived = false
        
        this.hideUpdateButtonIfNoPushesPending()
      } else {
        teacher.archived = true
        teacher.showSubjects = false

        this.$store.commit('setUpdateRequested', true)
      }

      localStorage.setItem('teachers', JSON.stringify(this.teachers))
      this.$store.commit('updateLastSaveDate')
      
      this.$forceUpdate()
    },
    // Subject Funcs
    addSubject(teacher, i) {
      if (teacher.local) {
        throw new Error('Teacher is local.')
      }

      if (!this.tempSubjects[i]) {
        this.setErrOrInfo('Bitte geben Sie den Namen des Faches ein; z. B. Deutsch', 'bad')
      }

      teacher.subjects.push({
        name: this.tempSubjects[i],
        teacherUname: teacher.username,
        teacherName: teacher.name,
        local: true
      })

      this.tempSubjects[i] = null

      this.$store.commit('setUpdateRequested', true)
    },
    removeSubjectFromPush(teacherIndex, subjIndex) {
      this.teachers[teacherIndex].subjects.splice(subjIndex, 1)

      this.hideUpdateButtonIfNoPushesPending()
    },
    // Async
    async pushToDB() {
      // Filter Teachers for DB Push
      let localTeachers = []
      let archivedTeachers = []
      this.teachers.forEach(teacher => {
        if (teacher.local) {
          localTeachers.push(teacher)
        }

        if (teacher.archived) {
          const archivedTeacher = {
            username: teacher.username
          }

          archivedTeachers.push(archivedTeacher)

          teacher.archivedInDB = true
        }
      })

      // Filter Subjects for DB Push
      let localSubjects = []
      this.teachers.forEach(t => {
        t.subjects.forEach(subj => {
          if (subj.local) {
            subj.teacherName = t.name
            subj.teacherUname = t.username

            localSubjects.push(subj)
          }
        })
      })

      const response = await axios.post(`${config.domain}/teacher-and-subject-manager`, {
        teachers: localTeachers,
        teachersForArchive: archivedTeachers,
        subjects: localSubjects
      })
      const responseTeachers = response.data.usernames

      if (response.status === 201) {
        responseTeachers.forEach(responseTeacher => {
          // Assign created username to Local Teacher Accounts
          let i = this.teachers.findIndex(x => 
            x.local === true &&
            x.counterID === responseTeacher.counterID
          )

          responseTeacher.showSubjects = true

          if (i !== -1) this.teachers[i].username = responseTeacher.username
        })

        // clear teacher locals
        this.teachers.map(teacher => {
          teacher.local = false
          delete teacher.counterID
        })

        // clear subject locals
        this.teachers.forEach(teacher => {
          teacher.subjects.forEach(subj => {
            subj.local = false
          })
        })
      }

      this.$store.commit('updateLastSaveDate')
      this.$store.commit('setUpdateRunning', false)
      this.$store.commit('setTeachers', this.teachers)
      localStorage.setItem('teachers', JSON.stringify(this.teachers))
    },
    async fetchData() {
      const res = await this.$store.dispatch('fetchTMData')

      // Fetched from Local Storage
      if (res.fromLS) {
        this.teachers = res.data

        this.sortTeachers()

        this.$store.commit('setTeachers', this.teachers)
      } 
      // Freshly fetched from Database
      else {
        let teachers = res.data.teachers
        const subjects = res.data.subjects

        subjects.forEach(subj => {
          let teacherIndex = teachers.findIndex(x => x.username === subj.teacherUname)

          if (teacherIndex !== -1) teachers[teacherIndex].subjects.push(subj)
        })

        this.teachers = teachers

        this.sortTeachers()

        localStorage.setItem('teachers', JSON.stringify(this.teachers))
        this.$store.commit('setTeachers', this.teachers)
      }
    }
  },
 
}
</script>

<style lang="scss" scoped>
@import '@/includes/scss/centerX';
@import '@/includes/scss/centerY';
@import '@/includes/scss/centerXY';
@import '@/includes/scss/alignX';
@import '@/includes/scss/alignY';
@import '@/includes/scss/flexCenter';

$inputHeight: 45px;
#Centerer {
  @include centerXY;
  width: 90%;
  height: 90%;
  display: grid;
  grid-template-rows: $inputHeight calc(100% - #{$inputHeight});
}

$inputWidth: 290px;
$buttonSize: 30px;
$inputPadding: 15px;
.Creator {
  @include alignX;
  position: relative;
  display: grid;
  grid-template-columns: $inputWidth $buttonSize;
  width: $inputWidth + $buttonSize + $inputPadding;
  background-color: turquoise;
  border-radius: 5px;
  input {
    outline: none;
    font-weight: bold;
    font-size: 16px;
    width: $inputWidth;
    height: 100%;
    color: black;
    background-color: transparent;
    padding-left: $inputPadding;
    border: none;
    &::placeholder {
      color: rgba(0, 0, 0, 0.5);
    }
  }
  div {
    margin-top: auto;
    margin-bottom: auto;
    background-color: white;
    border-radius: 100%;
    height: 35px; width: 35px;
    cursor: pointer;
    box-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.2);
    transition: .15s ease-in-out;
    &:hover {
      height: 37px; width: 37px;
      background-color: rgb(56, 134, 187);
    }
  }
  i#btnAdd {
    color: black;
    margin-top: 10px;
    transform: scale(1.7);
    transition: .2s ease-in-out;
    &:hover {
      color: white;
    }
  }
}

.Subjects {
  width: 100%;
  height: 30px;
  border-radius: 0 !important;
  background-color: rgb(76, 120, 216);
  input {
    font-size: 13px !important;
  }
  i {
    margin-top: 3px !important;
    transform: scale(1.00) !important;
  }
  div {
    position: relative;
    height: 22px; width: 22px;
    margin-left: -20px !important;
    &:hover {
      height: 25px; width: 25px;
    }
  }
}

.Subject {
  display: grid;
  grid-template-rows: 80% 20%;
  width: 100%;
  height: 20px;
  margin-top: 3px;
  @include alignX;
  background-color: rgba(37, 148, 129, 0.65);
  span {
    @include flexCenter;
    font-weight: bold;
    height: 28px;
  }
  i {
    @include flexCenter;
    position: absolute;
    top: 4px;
    right: 10px;
    height: 20px;
  }
}

#TeacherList {
  padding-top: 10px;
  overflow-x: hidden;
  overflow-y: scroll;
  max-height: 93%;
  width: 320px;
  @include alignX;
  &::-webkit-scrollbar {
    position: absolute;
    width: 0px;
    background: transparent;
    padding-left: 30px;
  }
  li {
    position: relative;
    width: 300px;
    display: grid;
    grid-template-columns: 85% 12.5% 12.5%;
    color: white;
    padding-bottom: 10px;
    div.Naming {
      display: grid;
      grid-template-rows: 100% 0%;
      span.name {
        font-weight: bold;
        border-radius: 3px;
        background-color: rgb(76, 96, 161);
        font-size: 16px;
        padding-top: 10px;
        padding-bottom: 10px;
        border: 2px solid rgba(255, 255, 255, 0.15);
      }
      span.uname {
        @include alignY;
        border-radius: 3px;
        background-color: rgb(72, 122, 179);
        width: 100%;
        font-size: 12px;
        top: 30px;
        left: 40px;
        font-weight: bold;
        color: rgba(0, 0, 0, 0.8);
      }
    }
    i {
      @include alignY;
      transform: scale(1.3);
    }
    i.deleter {
      color: rgb(204, 43, 43);
      transition: .2s ease-in-out;
      &:hover {
        color: white;
      }
    }
    i.local {
      color: yellow !important;
    }
    i.showSubjects {
      &:hover {
        color: rgb(65, 162, 218) !important;
      }
    }
    ul#Subjects {
      padding-top: 5px;
      padding-bottom: 3px;
      width: 125%;
      @include alignX;
      border: 1px solid rgb(34, 165, 177);
      border-top: none;
      li {
        width: 80%;
      }
    }
  }
}

.enableNameGrid {
  grid-template-rows: 65% 35% !important;
}

.teacherArchived {
  background-color: gray !important;
}

.teacherUnameArchived {
  background-color: rgb(95, 95, 95) !important;
}

.subjsIconRotation {
  transition: .25s ease-in-out;
  transform: rotate(180deg) scale(1.3) !important;
}

.fa-archive {
  transition: .15s ease;
  &:hover {
    color: royalblue;
  }
}

.archivedIconColor {
  color: gray !important;
  &:hover {
    color: gray !important;
  }
}

</style>