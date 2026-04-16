<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";

const props = defineProps<{
  num1: number;
  num2: number;
  correctAnswer: number;
  operation: string;
  modelValue: string;
  showAnswers: boolean;
}>();

const emit = defineEmits<{
  (_e: "feedback", _payload: { show: boolean; isCorrect: boolean }): void;
  (_e: "update:modelValue", _value: string): void;
  (_e: "correctAnswer"): void;
  (_e: "focus"): void;
  (_e: "blur"): void;
}>();

const digitBoxSize = "1.8em";
const answerRefs = ref<HTMLInputElement[]>([]);
const answerFields = ref<string[]>([]);
const carryDigits = ref<string[]>([]);
const isCorrect = ref(false);
const showFeedback = ref(false);
const isComplete = ref(false);

const num1Digits = computed(() => String(props.num1).split(""));
const num2Digits = computed(() => String(props.num2).split(""));
const isAddition = computed(() => props.operation === "+");
const maxWidth = computed(
  () =>
    Math.max(
      String(props.correctAnswer).length,
      num1Digits.value.length,
      num2Digits.value.length + 1,
    ) + 1,
);

const initialize = () => {
  const isSolved = props.modelValue === String(props.correctAnswer);
  const fill = props.showAnswers || isSolved;
  const answerStr = String(props.correctAnswer);

  answerFields.value = fill
    ? answerStr.split("").reverse()
    : Array(answerStr.length).fill("");
  isComplete.value = isCorrect.value = fill;
  showFeedback.value = false;
  carryDigits.value = Array(
    Math.max(num1Digits.value.length, num2Digits.value.length),
  ).fill("");
  answerRefs.value = [];
};

const setAnswerRef = (el: unknown, i: number) => {
  if (el) answerRefs.value[i] = el as HTMLInputElement;
};

const updateCarries = () => {
  if (!isAddition.value) {
    carryDigits.value.fill("");
    return;
  }
  const maxLen = carryDigits.value.length;
  const n1 = String(props.num1).padStart(maxLen, "0");
  const n2 = String(props.num2).padStart(maxLen, "0");
  const newCarries = Array(maxLen).fill("");
  let carry = 0;
  for (let i = maxLen - 1; i >= 0; i--) {
    carry = Math.floor((parseInt(n1[i]) + parseInt(n2[i]) + carry) / 10);
    if (carry > 0 && i > 0 && answerFields.value[maxLen - 1 - i] !== "")
      newCarries[i - 1] = String(carry);
  }
  carryDigits.value = newCarries;
};

const validate = () => {
  const ans = answerFields.value.slice().reverse().join("");
  emit("update:modelValue", ans);
  if (answerFields.value.some((f) => f === "")) {
    showFeedback.value = false;
    return;
  }

  showFeedback.value = true;
  isCorrect.value = isComplete.value = parseInt(ans) === props.correctAnswer;
  emit("feedback", { show: true, isCorrect: isCorrect.value });
  if (isCorrect.value) emit("correctAnswer");
};

const focusAnswer = (fieldIdx: number) => {
  updateCarries();
  const refIdx = answerFields.value.length - 1 - fieldIdx;
  answerRefs.value[refIdx]?.focus();
};

const handleInput = (event: Event, fieldIdx: number) => {
  const inputEvent = event as InputEvent;
  const data = inputEvent.data;
  inputEvent.preventDefault();
  if (inputEvent.inputType?.startsWith("delete")) {
    if (answerFields.value[fieldIdx] !== "") {
      answerFields.value[fieldIdx] = "";
      validate();
      updateCarries();
    }
    return;
  }
  if (!data || !/^\d$/.test(data)) return;

  answerFields.value[fieldIdx] = data;
  validate();
  updateCarries();

  nextTick(() => {
    const emptyCount = answerFields.value.filter((f) => f === "").length;
    if (emptyCount === 0) return;

    let nextIdx = -1;
    if (emptyCount === 1)
      nextIdx = answerFields.value.findIndex((f) => f === "");
    else if (emptyCount === 2) {
      for (let i = answerFields.value.length - 1; i >= 0; i--)
        if (answerFields.value[i] === "") {
          nextIdx = i;
          break;
        }
    } else if (fieldIdx < answerFields.value.length - 1) nextIdx = fieldIdx + 1;

    if (nextIdx !== -1)
      answerRefs.value[answerFields.value.length - 1 - nextIdx]?.focus();
  });
};

const handleKeydown = (event: KeyboardEvent, idx: number) => {
  if (event.key === "Backspace" && answerFields.value[idx] === "" && idx > 0) {
    event.preventDefault();
    answerFields.value[idx - 1] = "";
    validate();
    updateCarries();
    answerRefs.value[answerFields.value.length - idx]?.focus();
  } else if (event.key === "ArrowLeft" && idx < answerFields.value.length - 1) {
    event.preventDefault();
    answerRefs.value[answerFields.value.length - 2 - idx]?.focus();
  } else if (event.key === "ArrowRight" && idx > 0) {
    event.preventDefault();
    answerRefs.value[answerFields.value.length - idx]?.focus();
  }
};

watch(() => [props.num1, props.num2, props.showAnswers], initialize, {
  immediate: true,
});
defineExpose({ focus: () => focusAnswer(0) });
</script>

<template>
  <div
    class="long-addition-subtraction"
    style="font-family: &quot;Space Mono&quot;, monospace"
    dir="ltr"
  >
    <!-- Carry digits -->
    <div class="carry-row flex justify-end mb-[0.1em]">
      <span
        v-for="(carry, i) in carryDigits"
        :key="i"
        class="carry-digit font-bold inline-flex items-center justify-center text-[0.6em]"
        :style="{
          width: digitBoxSize,
          height: '1em',
          color: carry && isAddition ? 'var(--color-orange)' : 'transparent',
        }"
      >
        {{ carry || "" }}
      </span>
    </div>

    <!-- Numbers -->
    <div class="number-row flex justify-end">
      <span
        v-for="(d, i) in num1Digits"
        :key="i"
        class="font-bold inline-flex items-center justify-center"
        :style="{ width: digitBoxSize }"
        >{{ d }}</span
      >
    </div>
    <div class="number-row flex justify-end">
      <span
        class="operator inline-flex items-center justify-center"
        :style="{ width: digitBoxSize }"
        >{{ operation }}</span
      >
      <span
        v-for="(d, i) in num2Digits"
        :key="i"
        class="font-bold inline-flex items-center justify-center"
        :style="{ width: digitBoxSize }"
        >{{ d }}</span
      >
    </div>

    <!-- Separator -->
    <div
      class="separator ml-auto mt-[0.3em] mb-[0.4em] border-b-[3px] border-[var(--color-deep)]"
      :style="{ width: `calc(${digitBoxSize} * ${maxWidth})` }"
    />

    <!-- Answer -->
    <div class="answer-row flex justify-end">
      <div
        v-for="(_, i) in answerFields"
        :key="i"
        class="input-box"
        :class="{
          active: !isComplete,
          correct: showFeedback && isCorrect,
          incorrect: showFeedback && !isCorrect,
          'answers-shown': showAnswers,
        }"
        :style="{ width: digitBoxSize, height: digitBoxSize }"
        @click="focusAnswer(answerFields.length - 1 - i)"
      >
        <input
          :ref="(el) => setAnswerRef(el, i)"
          :value="answerFields[answerFields.length - 1 - i]"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="1"
          :disabled="showAnswers"
          class="digit-input"
          @beforeinput="(e) => handleInput(e, answerFields.length - 1 - i)"
          @keydown="(e) => handleKeydown(e, answerFields.length - 1 - i)"
          @focus="emit('focus')"
          @blur="emit('blur')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.digit-input {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  text-align: center;
  font-weight: bold;
  outline: none;
  padding: 0;
  margin: 0;
  color: var(--color-deep);
}
.input-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-deep);
  border-radius: 4px;
  margin: 0 1px;
  opacity: 0.4;
  transition: all 0.2s ease;
}
.input-box.active {
  opacity: 1;
  background: rgba(255, 255, 255, 0.3);
}
.input-box.correct {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.2);
  opacity: 1;
}
.input-box.incorrect {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  opacity: 1;
}
.input-box.completed {
  opacity: 0.6;
  background: rgba(16, 185, 129, 0.1);
}
</style>
