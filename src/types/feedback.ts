import type { Ref } from "vue";

export interface FeedbackState {
  [key: string]:
    | {
        show: boolean;
        isCorrect: boolean;
        value: string;
        attempts?: number;
        firstTry?: boolean;
      }
    | undefined;
}

export interface CompletionStats {
  total: number;
  firstTry: number;
  accuracy: number;
  timeInSeconds: number;
}

export interface QuestionFeedback<T> {
  feedbackState: Ref<FeedbackState>;
  handleFeedback: (
    id: string,
    state: { show: boolean; isCorrect: boolean; value: string },
  ) => void;
  setInputRef: (el: unknown, index: number) => void;
  focusNextInput: (index: number, total: number) => void;
  focusFirstInput: (questions: T[]) => void;
  focusInput: (index: number) => void;
  resetStats: () => void;
  clearAllFeedback: () => void;
  getCompletionStats: (total: number) => CompletionStats;
  correctCount: Ref<number>;
  handleBadgeClick: (
    question: T,
    index: number,
    reset?: (() => void) | null,
    focus?: (() => void) | null,
  ) => void;
}
