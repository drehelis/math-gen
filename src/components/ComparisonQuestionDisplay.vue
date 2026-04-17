<template>
  <div v-if="questions.length > 0">
    <CompletionOverlay
      :show="showCompletionOverlay"
      :stats="completionStats"
      @close="showCompletionOverlay = false"
    />

    <div class="print:hidden">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        dir="ltr"
      >
        <div
          v-for="(question, index) in questions"
          :key="question.id"
          class="question-card relative rounded-2xl p-3 sm:p-4 border-4 cursor-pointer"
          :style="getCardStyle(index)"
          @click="focusedIndex = index"
        >
          <div
            class="absolute -top-4 -left-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold border-4"
            :style="getBadgeStyle(index)"
          >
            <span class="text-sm sm:text-base">{{ index + 1 }}</span>
          </div>

          <FeedbackBadge
            v-if="!showAnswers && feedbackState[question.id]?.show"
            :is-correct="feedbackState[question.id]?.isCorrect ?? false"
            @click="onBadgeClick(index)"
          />

          <div
            class="flex items-center justify-center pt-6 sm:pt-5"
            style="font-family: &quot;Space Mono&quot;, monospace"
            dir="ltr"
          >
            <div
              class="text-base sm:text-lg md:text-xl xl:text-2xl font-bold whitespace-nowrap flex items-baseline"
              style="color: var(--color-deep)"
            >
              <template v-if="!showAnswers">
                <button
                  class="hover:opacity-70 transition-opacity cursor-pointer inline-block p-0 m-0 bg-transparent border-0"
                  style="
                    color: var(--color-deep);
                    font-family: inherit;
                    font-size: inherit;
                    font-weight: inherit;
                    line-height: inherit;
                  "
                  @click="handleAnswer(question.id, 'num1', question, index)"
                >
                  {{ question.num1 }}
                </button>
                <button
                  class="inline-block border-b-4 min-w-[3rem] text-center mx-2 hover:opacity-70 transition-opacity cursor-pointer p-0 bg-transparent border-x-0 border-t-0"
                  :style="{
                    borderBottomColor: 'var(--color-deep)',
                    color: 'var(--color-deep)',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    lineHeight: 'inherit',
                  }"
                  @click="handleAnswer(question.id, 'equal', question, index)"
                >
                  <span
                    :class="feedbackState[question.id]?.show ? '' : 'opacity-0'"
                    >{{ feedbackState[question.id]?.value || "_" }}</span
                  >
                </button>
                <button
                  class="hover:opacity-70 transition-opacity cursor-pointer inline-block p-0 m-0 bg-transparent border-0"
                  style="
                    color: var(--color-deep);
                    font-family: inherit;
                    font-size: inherit;
                    font-weight: inherit;
                    line-height: inherit;
                  "
                  @click="handleAnswer(question.id, 'num2', question, index)"
                >
                  {{ question.num2 }}
                </button>
              </template>
              <template v-else>
                <span class="inline-block p-0 m-0 relative">
                  <span
                    v-if="question.hasExpression"
                    class="absolute -top-4 left-1/2 transform -translate-x-1/2 text-sm opacity-40"
                    >{{ question.leftValue }}</span
                  >
                  {{ question.num1 }}
                </span>
                <span
                  class="inline-block relative mx-2 min-w-[3rem] text-center border-b-4 p-0"
                  :style="{ borderBottomColor: 'var(--color-deep)' }"
                >
                  <span class="opacity-40">{{
                    feedbackState[question.id]?.value ||
                    question.correctOperator
                  }}</span>
                </span>
                <span class="inline-block p-0 m-0 relative">
                  <span
                    v-if="question.hasExpression"
                    class="absolute -top-4 left-1/2 transform -translate-x-1/2 text-sm opacity-40"
                    >{{ question.rightValue }}</span
                  >
                  {{ question.num2 }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <PageFooter />
    </div>

    <div class="hidden print:block">
      <template
        v-for="(page, pageIndex) in paginateQuestions(questions, 30)"
        :key="`comparison-page-${pageIndex}`"
      >
        <div
          class="print-page"
          :class="{ 'print:break-before-page': pageIndex > 0 }"
        >
          <h2 class="text-xl font-bold mb-4" style="color: black">
            {{ $t("app.title") }}
          </h2>
          <div class="print-horizontal-grid" dir="ltr">
            <div
              v-for="question in page"
              :key="question.id"
              class="print-horizontal-item"
            >
              <span class="equation-number">{{ question.displayIndex }})</span>
              <span class="equation">
                <span class="number">{{ question.num1 }}</span>
                <span class="answer-blank"></span>
                <span class="number">{{ question.num2 }}</span>
              </span>
            </div>
          </div>
        </div>
      </template>

      <template v-if="showAnswers">
        <template
          v-for="(page, pageIndex) in paginateQuestions(questions, 30)"
          :key="`comparison-answer-page-${pageIndex}`"
        >
          <div class="print-page print:break-before-page">
            <h2 class="text-xl font-bold mb-4" style="color: black">
              {{ $t("answerKey.title") }}
            </h2>
            <div class="print-horizontal-grid" dir="ltr">
              <div
                v-for="question in page"
                :key="question.id"
                class="print-horizontal-item"
              >
                <span class="equation-number"
                  >{{ question.displayIndex }})</span
                >
                <span class="equation">
                  <span class="number">{{ question.num1 }}</span>
                  <span class="operator">{{ question.correctOperator }}</span>
                  <span class="number">{{ question.num2 }}</span>
                </span>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>

  <PageFooter v-else :show-empty-message="true" />
</template>

<script setup lang="ts">
import { watch, ref, onMounted } from "vue";
import CompletionOverlay from "./CompletionOverlay.vue";
import PageFooter from "./PageFooter.vue";
import FeedbackBadge from "./FeedbackBadge.vue";
import { useQuestionFeedback } from "../composables/useQuestionFeedback";

interface Side {
  display: string;
  value: number;
  operation?: string;
  num1?: number;
  num2?: number;
  operatorSymbol?: string;
}

interface Question {
  id: string;
  num1: string | number;
  num2: string | number;
  leftValue: number;
  rightValue: number;
  correctOperator: string;
  answer: string;
  userAnswer: string;
  hasExpression: boolean;
  leftSide?: Side;
  rightSide?: Side;
  displayIndex?: number;
}

const props = defineProps<{
  questions: Question[];
  showAnswers?: boolean;
  difficulty?: string;
}>();

import { useStyles } from "../composables/useStyles";

import type { QuestionFeedback } from "../types/feedback";

const {
  feedbackState,
  handleFeedback,
  clearAllFeedback,
  getCompletionStats,
  correctCount,
  handleBadgeClick: handleBadgeClickHelper,
} = useQuestionFeedback(
  "math-gen-comparison-feedback",
) as unknown as QuestionFeedback<Question>;

const showCompletionOverlay = ref(false);
const completionStats = ref({
  total: 0,
  firstTry: 0,
  timeInSeconds: 0,
  accuracy: 100,
});
const focusedIndex = ref(0);

const { getCardStyle, getBadgeStyle, paginateQuestions } = useStyles(
  props,
  feedbackState,
  focusedIndex,
);

const handleAnswer = (
  questionId: string,
  clickedNumber: string,
  question: Question,
  index: number,
) => {
  const leftValue = question.hasExpression
    ? (question.leftValue as number)
    : (question.num1 as number);
  const rightValue = question.hasExpression
    ? (question.rightValue as number)
    : (question.num2 as number);

  let displayedOperator;
  let isCorrect = false;

  if (clickedNumber === "equal") {
    displayedOperator = "=";
    isCorrect = leftValue === rightValue;
  } else if (clickedNumber === "num1") {
    displayedOperator = ">";
    isCorrect = leftValue > rightValue;
  } else {
    displayedOperator = "<";
    isCorrect = rightValue > leftValue;
  }

  handleFeedback(questionId, {
    show: true,
    isCorrect,
    value: displayedOperator,
  });

  if (isCorrect && index + 1 < props.questions.length) {
    setTimeout(() => {
      focusedIndex.value = index + 1;
    }, 300);
  }
};

watch(
  () => props.questions,
  (newQuestions, oldQuestions) => {
    if (newQuestions.length > 0 && !props.showAnswers) {
      if (
        !oldQuestions ||
        newQuestions.length !== oldQuestions.length ||
        newQuestions[0]?.id !== oldQuestions[0]?.id
      ) {
        clearAllFeedback();
        showCompletionOverlay.value = false;
        focusedIndex.value = 0;
      }
    }
  },
  { deep: true },
);

watch(
  () => correctCount.value,
  (newCount) => {
    if (
      newCount === props.questions.length &&
      props.questions.length > 0 &&
      !props.showAnswers
    ) {
      completionStats.value = getCompletionStats(props.questions.length);
      setTimeout(() => {
        showCompletionOverlay.value = true;
      }, 500);
    }
  },
);

onMounted(() => {
  if (props.questions.length > 0 && !props.showAnswers) {
    const idx = props.questions.findIndex(
      (q) => !feedbackState.value[q.id]?.isCorrect,
    );
    focusedIndex.value = idx === -1 ? 0 : idx;
  }
});

const onBadgeClick = (index: number) => {
  const q = props.questions[index];
  handleBadgeClickHelper(
    q,
    index,
    () => handleFeedback(q.id, { show: false, isCorrect: false, value: "" }),
    () => (focusedIndex.value = index),
  );
};
</script>

<style scoped>
@media print {
  .print-horizontal-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-flow: column;
    grid-template-rows: repeat(15, auto);
    gap: 2em 4em;
    width: 100%;
  }

  .print-horizontal-item {
    display: flex;
    align-items: center;
  }

  .print-horizontal-item .equation-number {
    display: inline-block;
    font-family: "Space Mono", monospace;
    font-size: 14px;
    width: 2.5em;
    text-align: right;
    margin-right: 0.5em;
  }

  .equation {
    display: inline-block;
    font-family: "Space Mono", monospace;
    font-size: 14px;
  }

  .equation .number {
    display: inline-block;
    text-align: right;
    min-width: 2ch;
  }

  .equation .operator {
    display: inline-block;
    margin: 0 0.3em;
  }

  .equation .answer-blank {
    display: inline-block;
    min-width: 4em;
    margin-left: 0.3em;
    margin-right: 0.3em;
    border-bottom: 1px solid black;
    text-align: center;
    line-height: 0.8;
  }
}
</style>
