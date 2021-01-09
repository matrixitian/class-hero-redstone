<template>
  <div>
    <!-- Room List -->
    <ul id="RoomList">
      <div id="roomListPositioner">
        <transition-group name="fade" mode="in-out">
          <li class="Room" v-for="(room, i) in rooms" :key="i"
          :class="[{normalRoom: room.type == 'Normaler Raum'}, {notAllowed: room.taken}]"
          :style="{backgroundColor: chooseTypeColor(i)}"
          @click="selectRoom(i)">
            <!-- Room Name -->
            <div class="roomName">
              <span :style="{borderColor: chooseTypeColor(i)}"
               :class="{taken: room.taken}">
                {{ room.name }}
              </span>
            </div>
            <!-- Room Type -->
            <div class="roomType" v-if="room.type !== 'Normaler Raum'"
            :class="{takenLight: room.taken}">
              <span>{{ room.type }}</span>
            </div>
          </li>
        </transition-group>  
      </div>
    </ul>
  </div>
</template>

<script>
import axios from 'axios'
import config from '@/includes/js/config'
const log = console.log

export default {
  name: 'RoomSelector',
  props: ['day', 'hour', 'rplSelectedRoom'],
  data() {
    return {
      rooms: [],
      roomTypes: [] // For Colors
    }
  },
  methods: {
    fetchRooms() {
      return this.$store.dispatch('fetchRooms')
    },
    selectRoom(i) {
      // Only proceed if room is not already taken
      if (!this.rooms[i].taken) {
        this.rooms.forEach(room => {
          if (room.taken) room.taken = false
        })

        this.$emit('selected', this.rooms[i])
      }
    },
    chooseTypeColor(i) {
      const colors = ['yellowgreen', 'orange', 'skyblue', 
      'purple', 'pink', '#00cc66', '#cc3399', '#ff6699', '#3399ff', 'yellow']
      const roomType = this.rooms[i].type
      const pos = this.roomTypes.indexOf(roomType)

      if (pos === -1) {
        return colors[colors.length - 1]
      }

      if (this.rooms[i].taken) {
        return 'red'
      } else {
        return colors[pos]
      }
    },
  },
  async mounted() {
    this.$store.subscribe(async(mutation, state) => {
      if (mutation.type === 'setUnevenWeek') {
        this.unevenWeek = state.unevenWeek
      }
    })

    this.rooms = await this.fetchRooms() // fetch from Store

    this.rooms.forEach(room => {
      if (!this.roomTypes.includes(room.type)) {
        this.roomTypes.push(room.type)
      }
    })

    // Reset unavailability first 
    this.rooms.forEach(room => {
      room.taken = false
    })

    // Check if room is taken, if so add {CSS Class} to visualize it
    this.rooms.forEach(room => {
      let index

      if (this.rplSelectedRoom) {
        if (room.name === this.rplSelectedRoom.name) {
          log('same room')
          return room.taken = true
        }

        index = room.dynamicTakenHours.findIndex(x =>
          x.hour === this.rplSelectedRoom.hour &&
          x.name === room.name &&
          x.coupler === this.rplSelectedRoom.coupler &&
          x.date === this.rplSelectedRoom.date
        )

        log('rpl index:', index)
      } else {
          if (this.unevenWeek) {
          index = room.uw_staticTakenHours[this.day].indexOf(this.hour)
        } else {
          index = room.staticTakenHours[this.day].indexOf(this.hour)
        }
      }

      if (index != -1) {
        room.taken = true
      }
    })
  }
}
</script>

<style lang="scss" scoped>
@import '@/includes/scss/centerXY';
@import '@/includes/scss/flexCenter';

.taken {
  border: 1px solid rgba(0, 0, 0, 0.5) !important;
  background-color: red !important;
}

// For type, so that both parts are not the same shade of read
.takenLight {
  background-color: rgb(165, 38, 38) !important;
}

.notAllowed {
  cursor: not-allowed !important;
  &:hover {
    transform: scale(1) !important;
  }
}

.normalRoom {
  grid-template-rows: 3fr !important;
  div.roomName {
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
  }
}

ul#RoomList {
  @include centerXY;
  z-index: 50;
  width: 70%;
  height: 70%;
  background-color: rgb(80, 83, 109);
  border-left: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: 1px 1px 4px 1px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  div#roomListPositioner {
    @include centerXY;
    @include flexCenter;
    width: 93%;
    height: 95%;
    padding: 5px 10px 5px 10px;
    overflow-y: auto;
    overflow-x: hidden;
    border: 2px dashed rgba(255, 255, 255, 0.2);
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
      cursor: pointer;
      transition: .1s ease;
      &:hover {
        transform: scale(1.03);
      }
      div.roomName {
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        position: relative;
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

</style>