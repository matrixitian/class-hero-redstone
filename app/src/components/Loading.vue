<template>
  <div class="wrapper">
    <div class="blue ball"></div>
    <div class="red ball"></div>  
    <div class="yellow ball"></div>  
    <div class="green ball"></div>  
  </div>
</template>

<script>
export default {
  name: 'Loading'
}
</script>

<style scoped lang="scss">
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px
}

.ball {
  width: 22px;
  height: 22px;
  border-radius: 11px;
  margin: 0 10px;
  
  animation: 2s bounce ease infinite;
}

.blue {
  background-color: #4285F5;
}

.red {
  background-color: #EA4436;
  animation-delay: .25s;
}

.yellow {
  background-color: #FBBD06;
  animation-delay: .5s;
}

.green {
  background-color: #34A952;
  animation-delay: .75s;
}

@keyframes bounce {  
    50% {
        transform: translateY(25px);
    }
}
</style>
