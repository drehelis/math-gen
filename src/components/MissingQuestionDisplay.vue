<script setup lang="ts">
import { watch, onMounted, ref } from "vue";
import AnswerInput from "./AnswerInput.vue";
import CompletionOverlay from "./CompletionOverlay.vue";
import PageFooter from "./PageFooter.vue";
import FeedbackBadge from "./FeedbackBadge.vue";
import { useQuestionFeedback } from "../composables/useQuestionFeedback";
import { useStyles } from "../composables/useStyles";

interface Question {
  id: string;
  num1: number;
  num2: number;
  num3?: number;
  num4?: number;
  operation: string;
  operation2?: string;
  result?: number;
  answer: number;
  userAnswer: string;
  format: string;
  missingPosition: string;
  displayIndex?: number;
}

const props = defineProps<{
  questions: Question[];
  showAnswers?: boolean;
  difficulty?: string;
}>();

import type { QuestionFeedback } from "../types/feedback";

const {
  feedbackState,
  handleFeedback,
  setInputRef,
  focusNextInput,
  focusFirstInput,
  focusInput,
  clearAllFeedback,
  getCompletionStats,
  correctCount,
  handleBadgeClick: handleBadgeClickHelper,
} = useQuestionFeedback(
  "math-gen-missing-feedback",
) as unknown as QuestionFeedback<Question>;

const showCompletionOverlay = ref(false);
const completionStats = ref({
  total: 0,
  firstTry: 0,
  timeInSeconds: 0,
  accuracy: 100,
});
const focusedIndex = ref(-1);

const { getCardStyle, getBadgeStyle, paginateQuestions } = useStyles(
  props,
  feedbackState,
  focusedIndex,
);

onMounted(() => {
  if (props.questions.length > 0 && !props.showAnswers)
    focusFirstInput(props.questions);
});

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
      }
      focusFirstInput(newQuestions);
    }
  },
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

const handleBadgeClick = (index: number) =>
  handleBadgeClickHelper(props.questions[index], index);
</script>

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
          @click="focusInput(index)"
        >
          <div
            class="absolute -top-4 -left-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold border-4 z-10"
            :style="getBadgeStyle(index)"
          >
            <span class="text-sm sm:text-base">{{ index + 1 }}</span>
          </div>

          <FeedbackBadge
            v-if="!showAnswers && feedbackState[question.id]?.show"
            :is-correct="feedbackState[question.id]?.isCorrect ?? false"
            @click="handleBadgeClick(index)"
          />

          <div
            class="flex items-center justify-center pt-6 sm:pt-5"
            style="font-family: &quot;Space Mono&quot;, monospace"
            dir="ltr"
          >
            <span
              class="text-base sm:text-lg md:text-xl xl:text-2xl font-bold whitespace-nowrap"
              style="color: var(--color-deep)"
            >
              <template
                v-if="!question.format || question.format === 'standard'"
              >
                <template v-if="question.missingPosition === 'first'">
                  <AnswerInput
                    v-if="!showAnswers"
                    :ref="(el) => setInputRef(el as any, index)"
                    v-model="question.userAnswer"
                    :correct-answer="question.answer"
                    @feedback="(data: any) => handleFeedback(question.id, data)"
                    @correct-answer="
                      () => focusNextInput(index, questions.length)
                    "
                    @focus="focusedIndex = index"
                    @blur="focusedIndex = -1"
                  />
                  <span
                    v-else
                    class="inline-block align-bottom border-b-4 min-w-[4rem] sm:min-w-[4.5rem] text-center"
                    :style="{ borderColor: 'var(--color-deep)' }"
                  >
                    <span class="opacity-40">{{ question.answer }}</span>
                  </span>
                  {{
                    " " +
                    question.operation +
                    " " +
                    question.num2 +
                    " = " +
                    question.result
                  }}
                </template>
                <template v-else>
                  {{ question.num1 + " " + question.operation + " " }}
                  <AnswerInput
                    v-if="!showAnswers"
                    :ref="(el) => setInputRef(el as any, index)"
                    v-model="question.userAnswer"
                    :correct-answer="question.answer"
                    @feedback="(data: any) => handleFeedback(question.id, data)"
                    @correct-answer="
                      () => focusNextInput(index, questions.length)
                    "
                    @focus="focusedIndex = index"
                    @blur="focusedIndex = -1"
                  />
                  <span
                    v-else
                    class="inline-block align-bottom border-b-4 min-w-[4rem] sm:min-w-[4.5rem] text-center"
                    :style="{ borderColor: 'var(--color-deep)' }"
                  >
                    <span class="opacity-40">{{ question.answer }}</span>
                  </span>
                  {{ " = " + question.result }}
                </template>
              </template>

              <template v-else-if="question.format === 'both-sides'">
                <template v-if="question.missingPosition === 'right-second'">
                  {{
                    question.num1 +
                    " " +
                    question.operation +
                    " " +
                    question.num2 +
                    " = " +
                    question.num3 +
                    " " +
                    (question.operation2 || question.operation) +
                    " "
                  }}
                  <AnswerInput
                    v-if="!showAnswers"
                    :ref="(el) => setInputRef(el as any, index)"
                    v-model="question.userAnswer"
                    :correct-answer="question.answer"
                    @feedback="(data: any) => handleFeedback(question.id, data)"
                    @correct-answer="
                      () => focusNextInput(index, questions.length)
                    "
                    @focus="focusedIndex = index"
                    @blur="focusedIndex = -1"
                  />
                  <span
                    v-else
                    class="inline-block align-bottom border-b-4 min-w-[4rem] sm:min-w-[4.5rem] text-center"
                    :style="{ borderColor: 'var(--color-deep)' }"
                  >
                    <span class="opacity-40">{{ question.answer }}</span>
                  </span>
                </template>
                <template
                  v-else-if="question.missingPosition === 'right-first'"
                >
                  {{
                    question.num1 +
                    " " +
                    question.operation +
                    " " +
                    question.num2 +
                    " = "
                  }}
                  <AnswerInput
                    v-if="!showAnswers"
                    :ref="(el) => setInputRef(el as any, index)"
                    v-model="question.userAnswer"
                    :correct-answer="question.answer"
                    @feedback="(data: any) => handleFeedback(question.id, data)"
                    @correct-answer="
                      () => focusNextInput(index, questions.length)
                    "
                    @focus="focusedIndex = index"
                    @blur="focusedIndex = -1"
                  />
                  <span
                    v-else
                    class="inline-block align-bottom border-b-4 min-w-[4rem] sm:min-w-[4.5rem] text-center"
                    :style="{ borderColor: 'var(--color-deep)' }"
                  >
                    <span class="opacity-40">{{ question.answer }}</span>
                  </span>
                  {{
                    " " +
                    (question.operation2 || question.operation) +
                    " " +
                    question.num4
                  }}
                </template>
                <template
                  v-else-if="question.missingPosition === 'left-second'"
                >
                  {{ question.num1 + " " + question.operation + " " }}
                  <AnswerInput
                    v-if="!showAnswers"
                    :ref="(el) => setInputRef(el as any, index)"
                    v-model="question.userAnswer"
                    :correct-answer="question.answer"
                    @feedback="(data: any) => handleFeedback(question.id, data)"
                    @correct-answer="
                      () => focusNextInput(index, questions.length)
                    "
                    @focus="focusedIndex = index"
                    @blur="focusedIndex = -1"
                  />
                  <span
                    v-else
                    class="inline-block align-bottom border-b-4 min-w-[4rem] sm:min-w-[4.5rem] text-center"
                    :style="{ borderColor: 'var(--color-deep)' }"
                  >
                    <span class="opacity-40">{{ question.answer }}</span>
                  </span>
                  {{
                    " = " +
                    question.num3 +
                    " " +
                    (question.operation2 || question.operation) +
                    " " +
                    question.num4
                  }}
                </template>
                <template v-else-if="question.missingPosition === 'left-first'">
                  <AnswerInput
                    v-if="!showAnswers"
                    :ref="(el) => setInputRef(el as any, index)"
                    v-model="question.userAnswer"
                    :correct-answer="question.answer"
                    @feedback="(data: any) => handleFeedback(question.id, data)"
                    @correct-answer="
                      () => focusNextInput(index, questions.length)
                    "
                    @focus="focusedIndex = index"
                    @blur="focusedIndex = -1"
                  />
                  <span
                    v-else
                    class="inline-block align-bottom border-b-4 min-w-[4rem] sm:min-w-[4.5rem] text-center"
                    :style="{ borderColor: 'var(--color-deep)' }"
                  >
                    <span class="opacity-40">{{ question.answer }}</span>
                  </span>
                  {{
                    " " +
                    question.operation +
                    " " +
                    question.num2 +
                    " = " +
                    question.num3 +
                    " " +
                    (question.operation2 || question.operation) +
                    " " +
                    question.num4
                  }}
                </template>
              </template>
            </span>
          </div>
        </div>
      </div>

      <PageFooter />
    </div>

    <div class="hidden print:block">
      <template
        v-for="(page, pageIndex) in paginateQuestions(questions, 30)"
        :key="`missing-page-${pageIndex}`"
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
              v-for="question in Array.isArray(page) ? page : []"
              :key="question.id"
              class="print-horizontal-item"
            >
              <span class="equation-number"
                >{{ (question as any).displayIndex }})</span
              >
              <span class="equation">
                <template
                  v-if="!question.format || question.format === 'standard'"
                >
                  <template v-if="question.missingPosition === 'first'">
                    <span class="answer-blank"></span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="number">{{ question.num2 }}</span>
                    <span class="equals">=</span>
                    <span class="number">{{ question.result }}</span>
                  </template>
                  <template v-else>
                    <span class="number">{{ question.num1 }}</span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="answer-blank"></span>
                    <span class="equals">=</span>
                    <span class="number">{{ question.result }}</span>
                  </template>
                </template>

                <template v-else-if="question.format === 'both-sides'">
                  <template v-if="question.missingPosition === 'right-second'">
                    <span class="number">{{ question.num1 }}</span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="number">{{ question.num2 }}</span>
                    <span class="equals">=</span>
                    <span class="number">{{ question.num3 }}</span>
                    <span class="operator">{{
                      question.operation2 || question.operation
                    }}</span>
                    <span class="answer-blank"></span>
                  </template>
                  <template
                    v-else-if="question.missingPosition === 'right-first'"
                  >
                    <span class="number">{{ question.num1 }}</span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="number">{{ question.num2 }}</span>
                    <span class="equals">=</span>
                    <span class="answer-blank"></span>
                    <span class="operator">{{
                      question.operation2 || question.operation
                    }}</span>
                    <span class="number">{{ question.num4 }}</span>
                  </template>
                  <template
                    v-else-if="question.missingPosition === 'left-second'"
                  >
                    <span class="number">{{ question.num1 }}</span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="answer-blank"></span>
                    <span class="equals">=</span>
                    <span class="number">{{ question.num3 }}</span>
                    <span class="operator">{{
                      question.operation2 || question.operation
                    }}</span>
                    <span class="number">{{ question.num4 }}</span>
                  </template>
                  <template
                    v-else-if="question.missingPosition === 'left-first'"
                  >
                    <span class="answer-blank"></span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="number">{{ question.num2 }}</span>
                    <span class="equals">=</span>
                    <span class="number">{{ question.num3 }}</span>
                    <span class="operator">{{
                      question.operation2 || question.operation
                    }}</span>
                    <span class="number">{{ question.num4 }}</span>
                  </template>
                </template>
              </span>
            </div>
          </div>
        </div>
      </template>

      <template v-if="showAnswers">
        <template
          v-for="(page, pageIndex) in paginateQuestions(questions, 30)"
          :key="`missing-answer-page-${pageIndex}`"
        >
          <div class="print-page print:break-before-page">
            <h2 class="text-xl font-bold mb-4" style="color: black">
              {{ $t("answerKey.title") }}
            </h2>
            <div class="print-horizontal-grid" dir="ltr">
              <div
                v-for="question in Array.isArray(page) ? page : []"
                :key="question.id"
                class="print-horizontal-item"
              >
                <span class="equation-number"
                  >{{ (question as any).displayIndex }})</span
                >
                <span class="equation">
                  <template
                    v-if="!question.format || question.format === 'standard'"
                  >
                    <span class="number">{{ question.num1 }}</span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="number">{{ question.num2 }}</span>
                    <span class="equals">=</span>
                    <span class="number">{{ question.result }}</span>
                  </template>

                  <template v-else-if="question.format === 'both-sides'">
                    <template
                      v-if="question.missingPosition === 'right-second'"
                    >
                      <span class="number">{{ question.num1 }}</span>
                      <span class="operator">{{ question.operation }}</span>
                      <span class="number">{{ question.num2 }}</span>
                      <span class="equals">=</span>
                      <span class="number">{{ question.num3 }}</span>
                      <span class="operator">{{
                        question.operation2 || question.operation
                      }}</span>
                      <span class="number">{{ question.answer }}</span>
                    </template>
                    <template
                      v-else-if="question.missingPosition === 'right-first'"
                    >
                      <span class="number">{{ question.num1 }}</span>
                      <span class="operator">{{ question.operation }}</span>
                      <span class="number">{{ question.num2 }}</span>
                      <span class="equals">=</span>
                      <span class="number">{{ question.answer }}</span>
                      <span class="operator">{{
                        question.operation2 || question.operation
                      }}</span>
                      <span class="number">{{ question.num4 }}</span>
                    </template>
                    <template
                      v-else-if="question.missingPosition === 'left-second'"
                    >
                      <span class="number">{{ question.num1 }}</span>
                      <span class="operator">{{ question.operation }}</span>
                      <span class="number">{{ question.answer }}</span>
                      <span class="equals">=</span>
                      <span class="number">{{ question.num3 }}</span>
                      <span class="operator">{{
                        question.operation2 || question.operation
                      }}</span>
                      <span class="number">{{ question.num4 }}</span>
                    </template>
                    <template
                      v-else-if="question.missingPosition === 'left-first'"
                    >
                      <span class="number">{{ question.answer }}</span>
                      <span class="operator">{{ question.operation }}</span>
                      <span class="number">{{ question.num2 }}</span>
                      <span class="equals">=</span>
                      <span class="number">{{ question.num3 }}</span>
                      <span class="operator">{{
                        question.operation2 || question.operation
                      }}</span>
                      <span class="number">{{ question.num4 }}</span>
                    </template>
                  </template>
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

  .equation .equals {
    display: inline-block;
    margin: 0 0.3em;
  }

  .equation .answer-blank {
    display: inline-block;
    min-width: 4em;
    margin-left: 0.3em;
    border-bottom: 1px solid black;
    text-align: center;
    line-height: 0.8;
  }
}
</style>
