<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Roboto|Pacifico&display=swap');
@import '@/includes/scss/Unselectable';

* {
  margin: 0;
  padding: 0;
}

ul {list-style: none}

span {@include Unselectable}

button {
  cursor: pointer;
  border: none;
}

button, input {
  font-family: 'Roboto', Helvetica, Arial, sans-serif;
}

body {
  overflow: hidden;
  // background-color: #2F3136;
}

i {cursor: pointer}

#app {
  font-family: 'Roboto', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
  width: 100vw;
}
</style>
