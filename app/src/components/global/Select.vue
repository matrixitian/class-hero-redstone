<template>
  <div>
    <ul id="List" @click="toggleList()"
    :class="{widthFix: widthFix}">
      <li id="selected" :class="{unavailable: options.length === 0}">
        <span id="selectedVal" v-if="selType === 'Default'">
          {{ selected }}
        </span>
        <span id="selectedVal" v-if="selType === 'Subject'">
          Fach hinzufügen
        </span>
        <span id="selectedVal" v-if="selType === 'Class'">
          {{ selected == null ?
          'Klasse auswählen':
          selected.name }}
        </span>
        <span id="selectedVal" v-if="selType === 'VertretungTeacher'">
          {{  `${selected.teacherUname} ${selected.name.substring(0, 3)}` }}
        </span>
        
        <div v-if="selected" class="selectClassTeacherDiv">
          <span id="selectedVal" v-if="selType === 'Teacher'">
            {{ 
              selected.username?
              `${selected.username}`:
              'Klassenlehrer' 
            }}
          </span>
        </div>
      
        <div id="chevron">
          <i class="fas fa-chevron-down"></i>
        </div>
      </li>
      <div v-if="listOpen && selType === 'Default'">
        <li class="option" 
        v-for="(option, i) in options" :key="i"
        @click="send(i)">
          <span>
            {{ option }}
          </span>
        </li>
      </div>

      <div v-if="listOpen && 
      (selType === 'Subject' || selType === 'VertretungTeacher')">
        <li class="option" 
        v-for="(option, i) in options" :key="i"
        @click="send(i)">
          <span class="TeacherSubject">
            <span>{{ option.teacherUname }}</span>
            <span class="subject">{{ option.name.substring(0, 3) }}</span>
          </span>
        </li>
      </div>

      <div v-if="listOpen && selType === 'Class'">
        <li class="option" 
        v-for="(option, i) in options" :key="i"
        @click="send(i)">
          <span>
            {{ option.name }}
          </span>
        </li>
      </div>

      <div v-else-if="listOpen && selType === 'Teacher'">
        <li class="option" 
        v-for="(option, i) in options" :key="i"
        @click="send(i)">
          <span >
            {{ option.username }}
          </span>
        </li>
      </div>

    </ul>
  </div>
</template>

<script>
const log = console.log

export default {
  name: 'Select',
  props: ['options', 'selType', 'classTeacher', 'widthFix'],
  data() {
    return {
      selected: null,
      listOpen: false
    }
  },
  methods: {
    toggleList() {
      this.listOpen = !this.listOpen
    },
    send(i) {
      if (this.selType === 'Teacher') {
        this.selected.username = this.options[i].username
      } else {
        this.selected = this.options[i]
      }

      this.$emit('optionSelected', this.options[i])
    }
  },
  mounted() {
    if (this.selType == 'Teacher') {
      this.selected = this.classTeacher
    } else if (this.selType == 'Class') {
      this.selected = null
    }
    else {
      this.selected = this.options[0]
    }

    this.$forceUpdate()
  }
}
</script>

<style lang="scss" scoped>
@import '@/includes/scss/flexCenterY';
@import '@/includes/scss/flexCenter';

.widthFix {
  width: 100% !important;
}

.unavailable {
  padding: 3px !important;
  color: #7c7676 !important;
  background-color: rgb(58, 61, 61) !important;
}

.selectClassTeacherDiv {
  margin-left: auto;
  margin-right: auto;
}

ul#List {
  height: 30px;
  width: 95%;
  li:nth-child(1) {
    @include flexCenterY;
    background-color: #808db3;
    cursor: pointer;
    transition: .15s ease;
    &:hover {
       background-color: rgb(228, 228, 228);
    }
    span#selectedVal {
      width: 80%;
      font-weight: bold;
    }
    div#chevron {
      @include flexCenterY;
      height: 30px;
      width: 30px;
      // padding-right: 5px;
      margin-left: auto;
    }
  }
  li.option {
    @include flexCenter;
    width: calc(100% - 2px);
    height: 100%;
    color: white;
    background-color: #61748a;
    margin-right: 5px;
    padding: 3px 0 3px 0;
    border: 1px solid rgba(0, 0, 0, 0.3);
    font-weight: bold;
    box-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: .15s ease;
    &:hover {
      background-color: #32c766;
    }
  }
}

span.TeacherSubject {
  display: grid;
  grid-template-columns: calc(100% - 40px) 40px;
  span {
    display: flex;
    justify-content: start;
    width: 100%;
  }
  .subject {
    border: 1px solid black;
    @include flexCenter;
    background-color: #506694;
    color: white;
    padding: 2px;
    font-size: 14px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    margin-left: 5px;
    width: 30px !important;
  }
}

</style>