<template>
  <teleport to="body">
    <div v-if="show" class="absolute top-0 right-0 bottom-0 left-0 z-10">
      <div class="relative h-screen w-screen">
        <div
          class="transform-middle h-auto bg-gray-gradient rounded-lg shadow-main text-white"
          :class="classes"
        >
          <div class="relative flex flex-col items-center">
            <slot />
            <div
              v-if="showClose"
              class="absolute top-2 right-4 cursor-pointer select-none text-2xl"
              @click="onClose"
            >
              X
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  emits: ["close"],
  props: {
    show: {
      type: Boolean,
      default: false
    },
    classes: {
      type: String,
      default: ""
    },
    showClose: {
      type: Boolean,
      default: true
    }
  },
  setup(_, { emit }) {
    const onClose = () => emit("close");

    return { onClose };
  }
});
</script>
