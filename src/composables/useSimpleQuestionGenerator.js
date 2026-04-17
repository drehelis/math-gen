import { checkEdgeCases } from "./useEdgeCaseRules";
import { usePersistentRef } from "./usePersistentRef";
import { getRandomInRange } from "../utils/mathUtils";
import { generateUniqueItems } from "../utils/generatorUtils";

let idCounter = 0;

export function useSimpleQuestionGenerator() {
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

  const questions = usePersistentRef("math-gen-simple-questions", []);
  const settings = usePersistentRef(
    "math-gen-simple-settings",
    defaultSettings,
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
    return getRandomInRange(min, max);
  };

  const generateQuestion = () => {
    const ops = settings.value.operations || [settings.value.operation];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const vary = settings.value.varySecondNumber;

    const varyFirst = Math.random() < 0.5;
    let n1 = getRandomNumber(vary && varyFirst);
    let n2 = getRandomNumber(vary && !varyFirst);

    let ans, symbol;
    if (op === "subtraction") {
      if (n1 < n2) [n1, n2] = [n2, n1];
      ans = n1 - n2;
      symbol = "-";
    } else if (op === "multiplication") {
      ans = n1 * n2;
      symbol = "×";
    } else if (op === "division") {
      n2 = getRandomInRange(1, settings.value.difficulty === "easy" ? 10 : 12);
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
    const availableOperations = settings.value.operations || [
      settings.value.operation,
    ];
    const edgeCaseTracker = {};

    questions.value = await generateUniqueItems({
      count: settings.value.count,
      generateItem: generateQuestion,
      getKey: (q) => `${q.num1}${q.operation}${q.num2}`,
      isValid: (q) => {
        const result = checkEdgeCases(q, availableOperations, edgeCaseTracker);
        return !result.shouldSkip;
      },
    });
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
