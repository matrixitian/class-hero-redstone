<template>
  <div id="Main">

    <div id="Topper">
      <img src="@/assets/logos/new_logo.svg">
    </div>

    <div id="Title">
      <span>Anmeldung - ClassHero</span>
    </div>

    <div id="Form">
      <!-- Username -->
      <div id="Username">
        <label>Anmeldename</label><br>
        <input v-focus v-model="username" ref="usernameField" type="username"><br>
      </div>
      <!-- Password -->
      <div id="Password">
        <label>Passwort oder Schlüssel</label><br>
        <input v-model="password" ref="passwordField" type="password"><br>
      </div>
      <!-- Weiter -->
      <button @click="attemptRequest()"
      :class="{btnLoadingTextColor: loading}">
        {{ loading?
        'Wird weitergeleitet...':
        'Weiter' }}
      </button>
    </div>

    <div id="Error" v-if="error">
      <span>{{ error }}</span>
    </div>

    <div id="Extras">
      <a href="#"><span>Bedingungen</span></a>
      <a href="#"><span>Privatsphäre</span></a>
    </div>

  </div>
</template>

<script>
import Axios from 'axios'
import router from '@/router'
import config from '@/includes/js/config'
const log = console.log

export default {
  name: 'Login',
  data () {
    return {
      username: null,
      password: null,
      loading: false,
      error: null,
    }
  },
  async created() {
    document.title = "Anmeldung | ClassHero"

    this.checkIfTokenExists()

    // Listens for Enter instead of having to click the SignUp/SignIn button!
    const v = this
    window.addEventListener('keyup', function(event) {
      if (event.keyCode === 13) { 
        v.attemptRequest()
      }
    })
  },
  methods: {
    checkIfTokenExists() {
      const token = localStorage.getItem('@token')
      
      if (token !== null) {
        router.push('/')
      }
    },
    setError(message) {
      this.error = message

      setTimeout(() => {
        this.error = null
      }, 4500)
    },
    resetError() {
      this.error = null
    },
    errorHandling() {
      if (!navigator.onLine) {
        this.setError('Bitte überprüfen Sie ihre Internetverbindung.')
        throw new Error('No connection.')
      }

      if (!this.username || !this.password) {
        this.setError('Eingabefelder können nicht leer sein.')
        throw new Error('Field empty.')
      }
    },
    attemptRequest() {
      if (this.password.length === 28 && this.password.includes('_exc_key')) { 
        this.recoverAccount()
      }
      else this.attemptLogin()
    },
    async attemptLogin() {
      this.errorHandling('login')
      this.loading = true

      log('attempting login...')
      try {
        const data = {
          username: this.username.toLowerCase(),
          password: this.password
        }

        const res = await Axios.post(`${config.domain}/login`, data)   

        localStorage.setItem('@token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        
        router.push('/')
      } catch (err) {
        log(err)
        if (!err.response) {
          this.setError('Verbindung zum Server konnte nicht hergestellt werden.')
        } else {
          this.setError('Eingegebene Daten sind falsch.')
        }
      }
      this.loading = false
    },
    async recoverAccount() {
      this.errorHandling()
      this.loading = true

      log('attempting account recovery...')
      try {
        const data = {
          username: this.username,
          recoveryKey: this.password
        }

        const res = await Axios.post(`${config.domain}/recover-account`, data)   

        localStorage.setItem('@token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))

        router.push('/')
      } catch (err) {
        if (!err.response) {
          this.setError('Verbindung zum Server konnte nicht hergestellt werden!')
        } else {
          this.setError('Eingegebene Daten sind falsch!')
        }
      }
      this.loading = false
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/includes/scss/flexCenter';
@import '@/includes/scss/centerX';
@import '@/includes/scss/centerY';
@import '@/includes/scss/centerXY';
@import '@/includes/scss/Unselectable';

#Main {
  padding-top: 20px;
  width: 100%;
  height: 100%;
  background-color: #f9f9f9 !important;
}

#Topper {
  width: 100%;
  height: 10%;
  position: relative;
  img {
    @include centerXY;
    height: 60px; width: 60px;
  }
}

#Title {
  position: relative;
  font-weight: lighter;
  width: 100%;
  height: 65px;
  font-size: 20px;
  color: rgb(83, 83, 83);
  span {
    @include centerXY;
  }
}

#Form {
  margin-left: auto;
  margin-right: auto;
  width: 310px;
  height: 230px;
  border: 1px solid #d8dee2;
  border-radius: 5px;
  background-color: white;
  label {
    font-size: 14px;
    font-weight: bold;
    float: left;
    margin-left: 28px;
    margin-bottom: 6px;
    margin-top: 22px;
  }
  input {
    font-size: 14px;
    color: #24292e;
    vertical-align: middle;
    line-height: 20px;
    padding: 5px 12px;
    border-radius: 6px;
    outline: none;
    border: 1px solid #e1e4e8;
    width: 230px;
    height: 20px;
    box-shadow: inset 0 1px 0 rgba(225, 228, 232, 0.2);
    &:focus {
      box-shadow: 0 0 1px 2px rgba(52, 207, 104, 0.5);
    }
  }
  button {
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    margin-top: 25px;
    width: 255px;
    height: 30px;
    outline: none;
    border-radius: 6px;
    color: #fff;
    background-color: #2ea44f;
    border-color: rgba(27,31,35,.15);
    box-shadow: 0 1px 0 rgba(27,31,35,.1), inset 0 1px 0 hsla(0,0%,100%,.03);
    transition: background-color .2s cubic-bezier(0.3, 0, 0.5, 1);
    &:focus {
      box-shadow: 0 0 1px 2px rgba(52, 207, 104, 0.5);
    }
  }
}

#Extras {
  margin-left: auto;
  margin-right: auto;
  margin-top: 30px;
  width: 230px;
  height: 30px;
  border-radius: 5px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  display: grid;
  grid-template-columns: 1fr 1fr;
  cursor: default;
  a {
    font-size: 13px;
    margin-top: auto;
    margin-bottom: auto;
    color: rgb(56, 144, 245);
  }
}

span, label {
  @include Unselectable;
}

#Error {
  position: relative;
  margin-left: auto;
  margin-right: auto;
  margin-top: 20px;
  margin-bottom: 20px;
  background-color: rgb(236, 89, 89);
  border: 1px solid  rgba(196, 59, 31, 0.7);
  border-radius: 4px;
  width: 270px;
  padding: 5px;
  span {
    margin-top: auto;
    margin-bottom: auto;
    margin-left: auto;
    margin-right: auto;
    font-size: 14px;
    color: white;
  }
}

.btnLoadingTextColor {
  color: rgb(196, 241, 200) !important;
}

</style>