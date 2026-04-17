<template>
  <div
    class="absolute -top-3 -right-3 w-10 h-10 rounded-lg flex items-center justify-center font-bold border-4"
    :class="{
      'cursor-pointer hover:scale-110 transition-transform': !isCorrect,
    }"
    :style="{
      backgroundColor: isCorrect ? '#15803d' : '#b91c1c',
      borderColor: 'var(--color-deep)',
      color: 'white',
    }"
    @click.stop="onClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <span v-if="isCorrect" class="text-xl">✓</span>
    <template v-else>
      <svg
        v-if="isHovered"
        class="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
      <span v-else class="text-xl">✗</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  isCorrect: {
    type: Boolean,
    required: true,
  },
});

const isHovered = ref(false);

const emit = defineEmits(["click"]);

const onClick = () => {
  if (!props.isCorrect) {
    emit("click");
  }
};
</script>

