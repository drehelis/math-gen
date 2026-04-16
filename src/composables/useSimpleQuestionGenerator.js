import { ref, watch } from "vue";
import { checkEdgeCases } from "./useEdgeCaseRules";
import { useLocalStorage } from "./useLocalStorage";

let idCounter = 0;

const settingsStorage = useLocalStorage("math-gen-simple-settings");
const questionsStorage = useLocalStorage("math-gen-simple-questions", []);

export function useSimpleQuestionGenerator() {
  const questions = ref(questionsStorage.load());
  const savedSettings = settingsStorage.load();

  const defaultSettings = {
    count: 20,
    difficulty: "easy",
    operation: "addition",
    operations: ["addition"],
    showAnswers: false,
    showGuide: true,
    varySecondNumber: false,
    inputMode: "native",
  };

  const settings = ref({ ...defaultSettings, ...(savedSettings || {}) });

  watch(
    settings,
    (newSettings) => {
      settingsStorage.save(newSettings);
    },
    { deep: true },
  );

  watch(
    questions,
    (newQuestions) => {
      questionsStorage.save(newQuestions);
    },
    { deep: true },
  );

  const getRandomNumber = (isSecond = false) => {
    const d = settings.value.difficulty;
    let [min, max] = [0, 10];
    if (d === "basic") [min, max] = [1, 20];
    else if (d === "medium") [min, max] = [10, 100];
    else if (d === "hard") [min, max] = [100, 900];
    else if (d === "tens") {
      const r = (200 - 10) / 10;
      return Math.floor(Math.random() * (r + 1)) * 10 + 10;
    }

    if (
      isSecond &&
      settings.value.varySecondNumber &&
      d !== "easy" &&
      d !== "beginners"
    ) {
      if (d === "hard") [min, max] = Math.random() < 0.5 ? [1, 10] : [10, 100];
      else if (Math.random() < 0.5) [min, max] = [1, 10];
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const generateQuestion = () => {
    const ops = settings.value.operations || [settings.value.operation];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const vary = settings.value.varySecondNumber;
    let n1 = getRandomNumber(vary && Math.random() < 0.5);
    let n2 = getRandomNumber(vary && !vary); // Wait, varySecondNumber && !varyFirst

    // Correction: let n1 = getRandomNumber(vary && varyFirst);
    const varyFirst = Math.random() < 0.5;
    n1 = getRandomNumber(vary && varyFirst);
    n2 = getRandomNumber(vary && !varyFirst);

    let ans, symbol;
    if (op === "subtraction") {
      if (n1 < n2) [n1, n2] = [n2, n1];
      ans = n1 - n2;
      symbol = "-";
    } else if (op === "multiplication") {
      ans = n1 * n2;
      symbol = "×";
    } else if (op === "division") {
      n2 =
        Math.floor(
          Math.random() * (settings.value.difficulty === "easy" ? 10 : 12),
        ) + 1;
      if (n1 % n2 !== 0) n1 = n2 * Math.floor(n1 / n2) || n2;
      ans = n1 / n2;
      symbol = "÷";
    } else {
      ans = n1 + n2;
      symbol = "+";
    }

    return {
      id: `q-${Date.now()}-${++idCounter}`,
      num1: n1,
      num2: n2,
      answer: ans,
      operation: symbol,
      userAnswer: "",
    };
  };

  const generateQuestions = async () => {
    const newQuestions = [];
    const seen = new Set();
    const maxAttempts = settings.value.count * 10;
    let attempts = 0;

    const availableOperations = settings.value.operations || [
      settings.value.operation,
    ];
    const edgeCaseTracker = {};

    while (
      newQuestions.length < settings.value.count &&
      attempts < maxAttempts
    ) {
      attempts++;
      const question = generateQuestion();
      const key = `${question.num1}${question.operation}${question.num2}`;

      const result = checkEdgeCases(
        question,
        availableOperations,
        edgeCaseTracker,
      );
      if (result.shouldSkip) continue;

      if (!seen.has(key)) {
        seen.add(key);
        newQuestions.push(question);
      }

      // Yield every 50 questions to keep UI responsive
      if (newQuestions.length % 50 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    questions.value = newQuestions;
  };

  const updateSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings };
  };

  return {
    questions,
    settings,
    generateQuestions,
    updateSettings,
  };
}
