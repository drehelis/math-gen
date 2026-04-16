<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";

const props = defineProps<{
  num1: number;
  num2: number;
  correctAnswer: number;
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
const currentStep = ref(1);
const carryDigits = ref<string[]>([]);
const ppFields = ref<string[][]>([[], [], []]); // [PP1, PP2, PP3]
const finalAnswerFields = ref<string[]>([]);
const showFeedback = ref<Record<number, boolean>>({
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
});
const refsMap = ref<Record<number, (HTMLInputElement | null)[]>>({}); // { 'step-index': [ref, ref, ...] }

const multiplicandDigits = computed(() => String(props.num1).split(""));
const multiplierDigits = computed(() => String(props.num2).split(""));
const finalStep = computed(() => multiplierDigits.value.length + 1);

const expectedPPs = computed(() => {
  return multiplierDigits.value
    .slice()
    .reverse()
    .map((digit) => props.num1 * parseInt(digit));
});

const partialProducts = computed(() => {
  return expectedPPs.value.map((expected, idx) => ({
    expected,
    fields: ppFields.value[idx],
    isCorrect:
      parseInt(ppFields.value[idx].slice().reverse().join("") || "0") ===
      expected,
  }));
});

const finalAnswerCorrect = computed(
  () =>
    parseInt(finalAnswerFields.value.slice().reverse().join("") || "0") ===
    props.correctAnswer,
);
const maxWidth = computed(
  () =>
    Math.max(
      String(props.correctAnswer).length,
      multiplicandDigits.value.length,
      multiplierDigits.value.length + 1,
    ) + 1,
);

const initialize = () => {
  const isSolved = props.modelValue === String(props.correctAnswer);
  const fill = props.showAnswers || isSolved;

  ppFields.value = [[], [], []];
  multiplierDigits.value.forEach((_, i) => {
    const str = String(expectedPPs.value[i]);
    ppFields.value[i] = fill
      ? str.split("").reverse()
      : Array(str.length).fill("");
  });

  const finalStr = String(props.correctAnswer);
  finalAnswerFields.value = fill
    ? finalStr.split("").reverse()
    : Array(finalStr.length).fill("");

  currentStep.value = fill ? finalStep.value + 1 : 1;
  carryDigits.value = Array(multiplicandDigits.value.length).fill("");
  Object.keys(showFeedback.value).forEach(
    (k) => (showFeedback.value[parseInt(k)] = false),
  );
  refsMap.value = {};
};

const setFieldRef = (el: unknown, step: number, idx: number) => {
  if (!refsMap.value[step]) refsMap.value[step] = [];
  if (el) refsMap.value[step][idx] = el as HTMLInputElement;
};

const updateCarries = () => {
  if (currentStep.value >= finalStep.value) {
    carryDigits.value.fill("");
    return;
  }
  const multDigit = parseInt(
    multiplierDigits.value.slice().reverse()[currentStep.value - 1],
  );
  const fields = ppFields.value[currentStep.value - 1];
  const newCarries = Array(multiplicandDigits.value.length).fill("");
  let carry = 0;
  multiplicandDigits.value
    .slice()
    .reverse()
    .forEach((d, i) => {
      const product = parseInt(d) * multDigit + carry;
      carry = Math.floor(product / 10);
      if (
        carry > 0 &&
        i < multiplicandDigits.value.length - 1 &&
        fields[i] !== ""
      )
        newCarries[multiplicandDigits.value.length - 2 - i] = String(carry);
    });
  carryDigits.value = newCarries;
};

const validate = () => {
  const step = currentStep.value;
  const isFinal = step === finalStep.value;
  const fields = isFinal ? finalAnswerFields.value : ppFields.value[step - 1];

  if (fields.some((f) => f === "")) {
    showFeedback.value[step] = false;
    return;
  }

  showFeedback.value[step] = true;
  const correct = isFinal
    ? finalAnswerCorrect.value
    : partialProducts.value[step - 1].isCorrect;

  emit("feedback", { show: true, isCorrect: correct });
  if (correct) {
    if (isFinal) {
      emit("correctAnswer");
      emit("update:modelValue", String(props.correctAnswer));
    } else {
      currentStep.value++;
      updateCarries();
    }
  }
};

const focusField = (step: number, fieldIdx: number) => {
  currentStep.value = step;
  updateCarries();
  const fields =
    step === finalStep.value
      ? finalAnswerFields.value
      : ppFields.value[step - 1];
  const revIdx = fields.length - 1 - fieldIdx;
  refsMap.value[step]?.[revIdx]?.focus();
};

const handleInput = (event: Event, step: number, fieldIdx: number) => {
  const inputEvent = event as InputEvent;
  const data = inputEvent.data;
  const fields =
    step === finalStep.value
      ? finalAnswerFields.value
      : ppFields.value[step - 1];
  const fieldsRef =
    step === finalStep.value
      ? finalAnswerFields
      : ref(ppFields.value[step - 1]);

  inputEvent.preventDefault();
  if (inputEvent.inputType?.startsWith("delete")) {
    if (fields[fieldIdx] !== "") {
      fieldsRef.value[fieldIdx] = "";
      validate();
      updateCarries();
    }
    return;
  }
  if (!data || !/^\d$/.test(data)) return;

  fieldsRef.value[fieldIdx] = data;
  validate();
  updateCarries();

  nextTick(() => {
    const emptyCount = fields.filter((f) => f === "").length;
    if (emptyCount === 0) return;

    let nextIdx = -1;
    if (emptyCount === 1) nextIdx = fields.findIndex((f) => f === "");
    else if (emptyCount === 2) {
      for (let i = fields.length - 1; i >= 0; i--)
        if (fields[i] === "") {
          nextIdx = i;
          break;
        }
    } else if (fieldIdx < fields.length - 1) nextIdx = fieldIdx + 1;

    if (nextIdx !== -1)
      refsMap.value[step]?.[fields.length - 1 - nextIdx]?.focus();
  });
};

const handleKeydown = (event: KeyboardEvent, step: number, idx: number) => {
  const fields =
    step === finalStep.value
      ? finalAnswerFields.value
      : ppFields.value[step - 1];
  const refs = refsMap.value[step];
  if (event.key === "Backspace" && fields[idx] === "" && idx > 0) {
    event.preventDefault();
    const f =
      step === finalStep.value
        ? finalAnswerFields
        : ref(ppFields.value[step - 1]);
    f.value[idx - 1] = "";
    validate();
    updateCarries();
    refs?.[fields.length - idx]?.focus();
  } else if (event.key === "ArrowLeft" && idx < fields.length - 1) {
    event.preventDefault();
    refs?.[fields.length - 2 - idx]?.focus();
  } else if (event.key === "ArrowRight" && idx > 0) {
    event.preventDefault();
    refs?.[fields.length - idx]?.focus();
  }
};

watch(() => [props.num1, props.num2, props.showAnswers], initialize, {
  immediate: true,
});
defineExpose({ focus: () => focusField(1, 0) });
</script>

<template>
  <div
    class="long-multiplication"
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
          color: carry ? 'var(--color-orange)' : 'transparent',
        }"
      >
        {{ carry || "" }}
      </span>
    </div>

    <!-- Numbers -->
    <div class="number-row flex justify-end">
      <span
        v-for="(d, i) in multiplicandDigits"
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
        >×</span
      >
      <span
        v-for="(d, i) in multiplierDigits"
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

    <!-- Partial Products -->
    <div
      v-for="(pp, stageIdx) in partialProducts"
      :key="stageIdx"
      class="partial-product-row flex justify-end mt-[0.2em]"
    >
      <div
        v-for="(_, fieldIdx) in pp.fields"
        :key="fieldIdx"
        class="input-box"
        :class="{
          active: currentStep === stageIdx + 1,
          completed: currentStep > stageIdx + 1,
          correct: currentStep > stageIdx + 1 && pp.isCorrect,
          incorrect: showFeedback[stageIdx + 1] && !pp.isCorrect,
          'answers-shown': showAnswers,
        }"
        :style="{ width: digitBoxSize, height: digitBoxSize }"
        @click="focusField(stageIdx + 1, pp.fields.length - 1 - fieldIdx)"
      >
        <input
          :ref="(el) => setFieldRef(el, stageIdx + 1, fieldIdx)"
          :value="pp.fields[pp.fields.length - 1 - fieldIdx]"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="1"
          :disabled="showAnswers"
          class="digit-input"
          :style="{ cursor: showAnswers ? 'default' : 'text' }"
          @beforeinput="
            (e) => handleInput(e, stageIdx + 1, pp.fields.length - 1 - fieldIdx)
          "
          @keydown="
            (e) =>
              handleKeydown(e, stageIdx + 1, pp.fields.length - 1 - fieldIdx)
          "
          @focus="emit('focus')"
          @blur="emit('blur')"
        />
      </div>
      <!-- Shift placeholders -->
      <div
        v-for="s in stageIdx"
        :key="`s-${s}`"
        class="shift-placeholder"
        :style="{ width: digitBoxSize, height: digitBoxSize }"
      />
    </div>

    <!-- Final Separator -->
    <div
      v-if="multiplierDigits.length > 1"
      class="separator ml-auto mt-[0.4em] mb-[0.4em] border-b-[3px] border-[var(--color-deep)]"
      :style="{ width: `calc(${digitBoxSize} * ${maxWidth})` }"
    />

    <!-- Final Answer -->
    <div
      v-if="multiplierDigits.length > 1"
      class="final-answer-row flex justify-end"
    >
      <div
        v-for="(_, i) in finalAnswerFields"
        :key="i"
        class="input-box"
        :class="{
          active: currentStep === finalStep,
          correct: showFeedback[finalStep] && finalAnswerCorrect,
          incorrect: showFeedback[finalStep] && !finalAnswerCorrect,
          'answers-shown': showAnswers,
        }"
        :style="{ width: digitBoxSize, height: digitBoxSize }"
        @click="focusField(finalStep, finalAnswerFields.length - 1 - i)"
      >
        <input
          :ref="(el) => setFieldRef(el, finalStep, i)"
          :value="finalAnswerFields[finalAnswerFields.length - 1 - i]"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="1"
          :disabled="showAnswers"
          class="digit-input"
          @beforeinput="
            (e) => handleInput(e, finalStep, finalAnswerFields.length - 1 - i)
          "
          @keydown="
            (e) => handleKeydown(e, finalStep, finalAnswerFields.length - 1 - i)
          "
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
.shift-placeholder {
  opacity: 0;
  margin: 0 1px;
}
</style>
