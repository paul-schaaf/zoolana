<template>
  <router-view />
</template>

<style lang="scss">
.bg-blue-gradient {
  background: linear-gradient(135deg, #0052d4, #6fb1fc);
}

.bg-gray-gradient {
  background: linear-gradient(135deg, #0b0b0b, #282828);
}

.shadow-main {
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}

.transform-middle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
}
</style>
