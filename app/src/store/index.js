import axios from 'axios'
import config from '@/includes/js/config'
import Vue from 'vue'
import Vuex from 'vuex'
const log = console.log

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    view: 'stundenplan',
    user: {},
    classes: [],
    teachers: [],
    subjects: [],
    rooms: [],
    dayIsClicked: true,
    // for UpdateInfo
    updateInfo: {
      msg: null,
      type: null
    },
    updateNeeded: false,
    updateRunning: false,
    shakeButton: false,
    appUpToDate: false
  },
  getters: {
    getTeachers(state) {
      return state.teachers
    },
    // Unchecked
    getRooms(state) {
      return state.rooms
    },
    getUser(state) {
      return state.user
    },
    getView(state) {
      return state.view
    }
  }, 
  mutations: {
    // General
    updateLastSaveDate() {
      localStorage.setItem('lastSaveTime', new Date())
    },
    setAppUpToDateState(state, condition) {
      state.appUpToDate = condition
    },
    setShakeButton(state, condition) {
      state.shakeButton = condition

      if (state.shakeButton) {
        setTimeout(() => {
          this.commit('setShakeButton', false)
        }, 700)
      }
    },
    setUpdateRunning(state, condition) {
      state.updateRunning = condition
      this.commit('setUpdateRequested', false)
    },
    setUpdateRequested(state, condition) {
      state.updateRequested = condition
    },
    setInfo(state, payload) {
      state.updateInfo.msg = payload.msg
      state.updateInfo.type = payload.type
    },
    // Component Mutations
    setTeachers(state, teachers) {
      state.teachers = teachers
    },
    // Unchecked
    setDayClicked(state, condition) {
      state.dayIsClicked = condition
    },
    setClassSchedule(state, classSchedule) {
      state.classSchedule = classSchedule
    },
    setClasses(state, classes) {
      state.classes = classes
    },
    setRooms(state, rooms) {
      state.rooms = rooms
    },
    addSubject(state, subject) {
      state.subjects.unshift(subject)
    },
    removeSubject(state, subject) {
      let filtered = state.subjects.filter(function( obj ) {
        return obj._id !== subject._id
      })

      state.subjects = filtered
    },
    setSubjects(state, subjects) {
      state.subjects = subjects
    },
    setUser(state, user) {
      state.user = user
    },
    setView(state, view) {
      state.view = view
    }
  },
  actions: {
    async fetchTMData(context) {
      let data

      // Local Storage is empty or app is not up to date
      if (!localStorage.getItem('teachers') || !context.state.appUpToDate) {
        const res = await axios.get(`${config.domain}/fetch-tm-data`)

        res.data.teachers.forEach((t) => {
          t.archivedInDB = true
          t.showSubjects = false
        })

        return {data: res.data, fromLS: false}
      } 

      // App is up to date and Local Storage is not empty!
      else {
        log('Fetching from LS...')
        data = localStorage.getItem('teachers')
        data = JSON.parse(data)
        
        context.state.teachers = data

        return {data, fromLS: true}
      }
    },
    // Unchecked
    async fetchClasses(context) {
      if (context.state.classes.length === 0) {
        const classes = await axios.get(`${config.domain}/fetch-classes`)
        context.commit('setClasses', classes.data)
      }

      return context.state.classes
    },
    async fetchTeachers(context) {
      if (context.state.teachers.length === 0) {
        let response = await axios.get(`${config.domain}/fetch-teacher-accounts-scheduler`)
        context.commit('addTeachers', response.data)
      }

      return context.getters.getTeachers
    },
    async fetchRooms(context) {
      if (context.state.rooms.length === 0) {
        const rooms = await axios.get(`${config.domain}/fetch-rooms`)
        context.commit('setRooms', rooms.data)
      }

      return context.state.rooms
    },
    async fetchSubjects(context) {
      if (context.state.subjects.length === 0) {
        const subjects = await axios.get(`${config.domain}/fetch-existing-subjects`)
        context.commit('setSubjects', subjects.data)
      }

      return context.state.subjects
    }
  },
  modules: {
  }
  
})
