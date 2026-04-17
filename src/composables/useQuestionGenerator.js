import { usePersistentRef } from "./usePersistentRef";
import { getRandomInRange } from "../utils/mathUtils";
import { generateUniqueItems } from "../utils/generatorUtils";

let idCounter = 0;

export function useQuestionGenerator() {
  const defaultSettings = {
    count: 20,
    difficulty: "easy",
    operation: "addition",
    showAnswers: false,
  };

  const questions = usePersistentRef("math-gen-questions", []);
  const settings = usePersistentRef("math-gen-settings", defaultSettings);

  const getRandomNumber = () => {
    let min = 0;
    let max = 10;

    switch (settings.value.difficulty) {
      case "easy":
        max = 10;
        break;
      case "beginners":
        min = 0;
        max = 10;
        break;
      case "basic":
        max = 20;
        break;
      case "medium":
        max = 100;
        break;
      case "hard":
        max = 1000;
        break;
      case "tens": {
        min = 10;
        max = 200;
        const tensRange = (max - min) / 10;
        return Math.floor(Math.random() * (tensRange + 1)) * 10 + min;
      }
    }
    return getRandomInRange(min, max);
  };

  const generateQuestion = () => {
    let num1 = getRandomNumber();
    let num2 = getRandomNumber();
    let answer;
    let operation;

    if (settings.value.operation === "subtraction") {
      if (num1 < num2) [num1, num2] = [num2, num1];
      answer = num1 - num2;
      operation = "-";
    } else if (settings.value.operation === "multiplication") {
      answer = num1 * num2;
      operation = "×";
    } else if (settings.value.operation === "division") {
      let divisorMax = settings.value.difficulty === "easy" ? 10 : 12;
      num2 = getRandomInRange(1, divisorMax);

      if (num1 % num2 !== 0) {
        num1 = num2 * Math.floor(num1 / num2);
        if (num1 === 0) num1 = num2;
      }

      answer = num1 / num2;
      operation = "÷";
    } else {
      answer = num1 + num2;
      operation = "+";
    }

    return {
      id: `q-${Date.now()}-${++idCounter}`,
      num1,
      num2,
      answer,
      operation,
    };
  };

  const generateQuestions = async () => {
    let hasZeroDivision = false;
    let hasOneDivision = false;

    questions.value = await generateUniqueItems({
      count: settings.value.count,
      generateItem: generateQuestion,
      getKey: (q) => `${q.num1}${q.operation}${q.num2}`,
      isValid: (q) => {
        if (settings.value.operation === "division") {
          if (q.num1 === 0) {
            if (hasZeroDivision) return false;
            hasZeroDivision = true;
          }
          if (q.num1 === q.num2) {
            if (hasOneDivision) return false;
            hasOneDivision = true;
          }
        }
        return true;
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
