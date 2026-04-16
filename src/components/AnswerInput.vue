<script setup lang="ts">
import { ref, computed, watch } from "vue";

const props = withDefaults(
  defineProps<{
    correctAnswer: number;
    modelValue?: string;
    showBorder?: boolean;
    textAlign?: string;
    reverseInput?: boolean;
    maxLength?: number;
    customWidth?: string;
    placeholder?: string;
  }>(),
  {
    showBorder: true,
    placeholder: "",
    textAlign: "center",
    maxLength: undefined,
    customWidth: undefined,
    reverseInput: false,
    modelValue: "",
  },
);

const emit = defineEmits<{
  (_e: "feedback", _payload: { show: boolean; isCorrect: boolean }): void;
  (_e: "update:modelValue", _value: string): void;
  (_e: "correctAnswer"): void;
  (_e: "focus"): void;
  (_e: "blur"): void;
}>();

const inputElement = ref<HTMLInputElement | null>(null);
const userAnswer = ref(props.modelValue || "");
const isCorrect = ref(false);
const showFeedback = ref(false);
const lastLength = ref(0);

const validateAnswer = () => {
  emit("update:modelValue", userAnswer.value);
  const answer = parseInt(userAnswer.value, 10);

  if (userAnswer.value === "" || isNaN(answer)) {
    showFeedback.value = false;
    isCorrect.value = false;
    emit("feedback", { show: false, isCorrect: false });
    return;
  }

  showFeedback.value = true;
  isCorrect.value = answer === props.correctAnswer;
  emit("feedback", { show: true, isCorrect: isCorrect.value });
  if (isCorrect.value) emit("correctAnswer");
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== userAnswer.value) {
      userAnswer.value = newValue || "";
      lastLength.value = userAnswer.value.length;
      validateAnswer();
    }
  },
);

const handleInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let val = input.value.replace(/[^\d-]/g, "");

  if (val.includes("-")) {
    const parts = val.split("-");
    val = "-" + parts.join("");
  }

  if (props.reverseInput) {
    const currentLength = val.length;
    if (currentLength > lastLength.value) {
      const newChars = val.slice(-(currentLength - lastLength.value));
      userAnswer.value =
        newChars.split("").reverse().join("") + userAnswer.value;
    } else if (currentLength < lastLength.value) {
      userAnswer.value = userAnswer.value.slice(
        lastLength.value - currentLength,
      );
    }
    val = userAnswer.value;
    input.value = val;
    setTimeout(() => input.setSelectionRange(val.length, val.length), 0);
  } else {
    userAnswer.value = val;
  }

  lastLength.value = userAnswer.value.length;
  validateAnswer();
};

const inputClasses = computed(() =>
  showFeedback.value
    ? isCorrect.value
      ? "text-green-600"
      : "text-red-600"
    : "",
);
const borderColor = computed(() =>
  showFeedback.value
    ? isCorrect.value
      ? "#15803d"
      : "#b91c1c"
    : "var(--color-deep)",
);

watch(
  () => props.correctAnswer,
  () => {
    userAnswer.value = "";
    isCorrect.value = showFeedback.value = false;
    emit("feedback", { show: false, isCorrect: false });
  },
);

defineExpose({ focus: () => inputElement.value?.focus() });
</script>

<template>
  <span
    class="relative inline-block"
    :class="[
      { 'border-b-4': showBorder !== false },
      customWidth || 'w-[4rem] sm:w-[4.5rem]',
    ]"
    :style="{ borderColor: showBorder !== false ? borderColor : 'transparent' }"
  >
    <input
      ref="inputElement"
      :value="userAnswer"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      :maxlength="maxLength || 6"
      class="w-full bg-transparent font-bold outline-none appearance-none px-0 leading-none border-0 focus:outline-none focus:ring-0 answer-input"
      :class="[inputClasses, `text-${textAlign || 'center'}`]"
      :placeholder="placeholder"
      style="color: var(--color-deep)"
      @input="handleInput"
      @focus="emit('focus')"
      @blur="emit('blur')"
    />
  </span>
</template>

<style scoped>
/* Remove number input spinners */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* Override global cursor style for answer inputs */
.answer-input {
  cursor: default !important;
}

.answer-input::placeholder {
  color: var(--color-deep);
  opacity: 0.3;
}
</style>
