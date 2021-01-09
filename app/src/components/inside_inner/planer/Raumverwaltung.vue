<template>
  <div>
        <!-- Main -->
        <div id="Functional">
          <!-- Options -->
          <div id="Options">

            <!-- Room Selector -->
            <input id="roomName" v-model="roomName" autofocus
            placeholder="Raum Name/Nummer" autocomplete="off">
            <div id="selectedItem" @click="toggleList()">
              <span>{{ selCat }}</span>
              <img id="dropdownArrow" :src="dropdownArrow">
            </div>

            <!-- Room Category List -->
            <ul id="roomCatSel" v-if="listShown">
              <!-- category list -->
              <li v-for="(cat, i) in cats" :key="i" @click="selectCat(i)"
              :style="{backgroundColor: chooseType2Color(i)}">
                {{ cat }}
              </li>
              <!-- new category -->
              <li>
                <button id="newCatToggle" v-if="!newCatA" @click="toggleNewCat()">
                  Neue Kategorie
                </button>
                <div v-else id="RoomCatInput">
                  <input v-model='newCatName' placeholder="Kategorie Name" autofocus>
                  <button @click="addCat()">
                    <img src="@/assets/icons/add.svg">
                  </button>
                </div>
              </li>
            </ul>
            <!-- Raum Erstellen -->
            <button id="addRoom" @click="addRoom()">Raum erstellen</button>

          </div>

          <!-- Room List -->
          <ul id="RoomList">
            <div id="roomListPositioner">
              <li id="noRoomsFound" v-if="rooms.length == 0">
                - Keine Räume gefunden -
              </li>
              <transition-group name="fade" mode="in-out">
                <li class="Room" v-for="(room, i) in rooms" :key="i"
                :class="{normalRoom: room.type == 'Normaler Raum'}"
                :style="{backgroundColor: chooseTypeColor(i)}"
                @mouseover="hovered = i"
                @mouseleave="hovered = null">
                  <div class="deleteRoom" @click="deleteRoom(i)">
                    <img src="@/assets/icons/close.svg" v-if="hovered == i">
                  </div>
                  <div class="roomName">
                    <span :style="{borderColor: chooseTypeColor(i)}">
                      {{ room.name }}
                    </span>
                  </div>
                  <div class="roomType" v-if="room.type != 'Normaler Raum'">
                    <span>{{ room.type }}</span>
                  </div>
                </li>
              </transition-group>  
            </div>
          </ul>
        </div>
      </div>
</template>

<script>
import axios from 'axios'
import config from '@/includes/js/config'
const log = console.log

import { mapActions } from 'vuex'

export default {
  name: 'Raumverwaltung',
  data() {
    return {
      roomName: null,
      // Cat = Category
      cats: ['PC Raum', 'Chemie Raum', 'Physik Raum'],
      listShown: false,
      selCat: 'Normaler Raum',
      // A = Active
      newCatA: false,
      newCatName: null,
      rooms: [],
      hovered: -1
    }
  },
  computed: {
    dropdownArrow() {
      return require('@/assets/icons/profile_arrow.svg')
    }
  },
  methods: {
     ...mapActions([
      'fetchRooms'
    ]),
    chooseTypeColor(i) {
      const colors = ['yellowgreen', 'orange', 'skyblue', 
      'purple', 'pink', '#00cc66', '#cc3399', '#ff6699', '#3399ff', 'yellow']
      const roomType = this.rooms[i].type
      const pos = this.cats.indexOf(roomType)

      if (pos === -1) {
        return colors[colors.length - 1]
      }
      return colors[pos]
    },
    chooseType2Color(i) {
      const colors = ['yellowgreen', 'orange', 'skyblue', 'yellow', 
      'purple', 'pink', '#00cc66', '#cc3399', '#ff6699', '#3399ff']
      if (i === -1) {
        return colors[colors.length - 1]
      }
      return colors[i]
    },
    toggleList() {
      this.listShown = !this.listShown
    },
    toggleNewCat() {
      this.newCatA = !this.newCatA
    },
    async addCat() {
      const data = {
        category: this.newCatName
      }
      const res = await axios.patch(`${config.domain}/create-room-category`, data)
      this.$store.commit('setUpdateRunning', true)
      let payload
      if (res.status === 200) {
        this.cats.push(this.newCatName)
        this.newCatName = null
        payload = {
          msg: 'Raum Kategorie erstellt.',
          type: 'good'
        }

        this.$store.commit('setUpdateRunning', false)
        this.$store.commit('setUpdateInfoMsg', payload)
      } else {
        payload = {
          msg: 'Fehler. Bitte versuchen Sie es nochmal.',
          type: 'bad'
        }
        this.$store.commit('setUpdateRunning', false)
        this.$store.commit('setUpdateInfoMsg', payload)
      }
    },
    selectCat(i) {
      const pushedCat = this.selCat
      this.selCat = this.cats[i]
      this.listShown = false
      // remove item
      this.cats.splice(i, 1)
      // push sel to list
      this.cats.push(pushedCat)
    },
    async addRoom() {
      const data = {
        name: this.roomName,
        type: this.selCat
      }
      const res = await axios.patch(`${config.domain}/create-room`, data)
      this.$store.commit('setUpdateRunning', true)

      let payload
      if (res.status === 200) {
        this.rooms.unshift({
          name: data.name,
          type: data.type
        })
        
        this.roomName = null
        payload = {
          msg: 'Raum erstellt.',
          type: 'good'
        }
        this.$store.commit('setUpdateRunning', false)
        this.$store.commit('setUpdateInfoMsg', payload)
      } else {
        payload = {
          msg: 'Fehler. Bitte versuchen Sie es nochmal.',
          type: 'bad'
        }
        this.$store.commit('setUpdateRunning', false)
        this.$store.commit('setUpdateInfoMsg', payload)
      }
    },
    async deleteRoom(i) {
      const _id = this.rooms[i]._id
      const res = await axios.post(`${config.domain}/delete-room`, {_id})
      this.$store.commit('setUpdateRunning', true)

      let payload
      if (res.status === 200) {
        this.rooms.splice(i, 1)
        payload = {
          msg: 'Raum gelöscht.',
          type: 'good'
        }

        this.$store.commit('setUpdateRunning', false)
        this.$store.commit('setUpdateInfoMsg', payload)
      } else {
        payload = {
          msg: 'Fehler. Bitte versuchen Sie es nochmal.',
          type: 'bad'
        }

        this.$store.commit('setUpdateRunning', false)
        this.$store.commit('setUpdateInfoMsg', payload)
      }
    }
  },
  async created() {
    // Get Rooms
    const rooms = await this.$store.dispatch('fetchRooms')
    rooms.forEach(room => {
      this.rooms.unshift(room)
    })
    // Get Room types
    let cats = await axios.get(`${config.domain}/fetch-room-types`)
    cats.data.forEach(roomType => {
      this.cats.unshift(roomType)
    })
  }
}
</script>

<style lang="scss" scoped>
@import '@/includes/scss/centerX';
@import '@/includes/scss/centerY';
@import '@/includes/scss/centerXY';
@import '@/includes/scss/animations/Fade';

#RoomCatInput {
  position: relative;
  display: grid;
  grid-template-columns: 3fr 1fr;
  input {
    width: 100%;
    padding: 5px;
    border-radius: 2px;
    border: 1px solid rgba(0, 0, 0, 0.2);
  }
  button {
    @include centerY;
    right: -4px;
    border-radius: 100%;
    height: 25px; width: 25px;
    background-color: limegreen;
    transition: .2s ease;
    &:hover {
      background-color: rgb(47, 125, 197);
    }
    img {
      height: 10px;
    }
  }
}

#Functional {
  @include centerXY;
  width: 80%;
  height: 80%;
  display: grid;
  grid-template-rows: 160px calc(100% - 160px);
  #Options {
    position: relative;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    color: #f0f0f0;
    background-color: rgb(97, 136, 199);
    z-index: 5;
    box-shadow: 2px 0 3px 1px rgba(0, 0, 0, 0.2);
    input#roomName {
      margin: 5px 5px 15px 5px;
      border: 1px solid rgba(0, 0, 0, 0.2);
      height: 40px;
      color: #f0f0f0;
      width: calc(100% - 10px);
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      background-color: transparent;
      &::placeholder {
        color: #b1b1b1;
      }
    }
  }
}

#selectedItem {
  @include centerX;
  display:table;
  width: 90%;
  height: 35px;
  border: none;
  border-bottom: 3px solid rgba(0, 0, 0, 0.3);
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: rgba(0, 0, 0, 0.2);
  }
  span, img {
    display:table-cell;
    vertical-align:middle;
  }
  #dropdownArrow {
    @include centerY;
    margin-left: -30px;
    height: 15px;
  }
}

ul#roomCatSel {
  @include centerX;
  margin-top: 50px;
  background-color: white;
  border-radius: 3px;
  box-shadow: 1px 1px 2px 1px rgba(0, 0, 0, 0.1);
  width: 60%;
  padding: 5px;
  li {
    padding: 5px;
    color: rgba(0, 0, 0, 0.6);
    font-weight: bold;
    margin-bottom: 2px;
    border-radius: 3px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.4);
    cursor: pointer;
    &:hover {
      transform: scale(1.02);
    }
    button#newCatToggle {
      padding: 3px 15px 3px 15px;
      border-radius: 3px;
      background-color: rgb(92, 101, 114);
      color: #f0f0f0;
    }
  }
  li:last-child {
    border: none;
    background-color: transparent;
    cursor: default;
    &:hover {
      transform: scale(1.00);
    }
    button {
      transition: .1s ease;
      &:hover {
        font-size: 14px;
      }
    }
  }
}

button#addRoom {
  margin-top: 50px;
  padding: 5px 15px 5px 15px;
  background-color: limegreen;
  font-size: 15px;
  border-radius: 2px;
  transition: .15s ease;
  outline: none;
  &:hover {
    font-size: 16px;
  }
}

ul#RoomList {
  position: relative;
  background-color: rgb(76, 96, 161);
  border-left: 1px solid rgba(0, 0, 0, 0.2);
  border-bottom: 5px;
  border-bottom-right-radius: 5px;
  div#roomListPositioner {
    @include centerXY;
    width: 85%;
    height: 85%;
    padding: 5px 10px 5px 10px;
    overflow-y: auto;
    overflow-x: hidden;
    border: 2px dashed rgba(255, 255, 255, 0.3);
    li#noRoomsFound {
      @include centerXY;
      font-size: 20px;
      text-decoration: underline;
      color: rgba(255, 255, 255, 0.5);
    }
    li.Room {
      position: relative;
      margin: 12px 6px 6px 6px;
      float: left;
      width: 120px;
      height: 80px;
      display: grid;
      grid-template-rows: 3fr 1fr;
      border-radius: 5px;
      box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
      transition: .2s ease;
      &:hover {
        transform: scale(1.02);
      }
      div.roomName {
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        position: relative;
        // background-color: yellowgreen;
        span {
          @include centerXY;
          white-space:nowrap;
          font-size: 22px;
          font-weight: bold;
          padding: 8px;
          border-radius: 4px;
          max-width: 100%;
          border: 2px dashed rgba(47, 167, 93, 0.7);
          background-color: whitesmoke;
          box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
        }
      }
      div.roomType {
        border-bottom-left-radius: 5px;
        border-bottom-right-radius: 5px;
        background-color: #f0f0ff;
        span {
          font-size: 12px;
          font-weight: bold;
        }
      }
    }
  }
}

.normalRoom {
  grid-template-rows: 3fr !important;
  div.roomName {
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
  }
}

.deleteRoom {
  z-index: 5;
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  cursor: pointer;
  transition: .2s ease;
  &:hover {
    background-color: rgba(255, 0, 0, 0.6);
  }
  img {
    @include centerXY;
    padding: 10px;
    background-color: whitesmoke;
    border-radius: 100%;
    height: 25px;
  }
}

#roomListPositioner::-webkit-scrollbar-track
{
	border: 1px solid black;
	background-color: rgb(245, 245, 245);
}

#roomListPositioner::-webkit-scrollbar
{
	width: 10px;
	background-color: rgb(168, 168, 168);
}

#roomListPositioner::-webkit-scrollbar-thumb
{
	background-color: #46b0b4;	
}

</style>