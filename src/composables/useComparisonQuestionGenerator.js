import { checkEdgeCases } from "./useEdgeCaseRules";
import { usePersistentRef } from "./usePersistentRef";
import { getRandomInRange } from "../utils/mathUtils";
import { generateUniqueItems } from "../utils/generatorUtils";

let idCounter = 0;

export function useComparisonQuestionGenerator() {
  const initialSettings = {
    count: 20,
    difficulty: "beginners",
    operation: "none",
    operations: ["none"],
    showAnswers: false,
    varySecondNumber: false,
  };

  const questions = usePersistentRef("math-gen-comparison-questions", []);
  const settings = usePersistentRef(
    "math-gen-comparison-settings",
    initialSettings,
  );

  const getRandomNumber = (max, isSecond = false) => {
    const d = settings.value.difficulty;
    let [min, maxVal] = [0, max || 10];
    if (d === "tens") {
      min = 10;
      maxVal = max || 200;
      return Math.floor(getRandomInRange(min, maxVal) / 10) * 10;
    }
    if (!max) {
      if (d === "beginners") [min, maxVal] = [0, 10];
      else if (["basic", "medium"].includes(d)) [min, maxVal] = [1, 20];
      else if (d === "easy") [min, maxVal] = [1, 10];
    }
    if (
      isSecond &&
      settings.value.varySecondNumber &&
      !["easy", "beginners"].includes(d)
    ) {
      if (d === "hard")
        [min, maxVal] = Math.random() < 0.5 ? [1, 10] : [10, 100];
      else if (Math.random() < 0.5) [min, maxVal] = [1, 10];
    }
    return getRandomInRange(min, maxVal);
  };

  const generateExpression = () => {
    const ops = settings.value.operations || ["addition"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const limit = ["medium", "tens"].includes(settings.value.difficulty)
      ? 100
      : 20;
    let n1, n2, val, sym;

    if (op === "multiplication") {
      n1 = getRandomNumber(10);
      n2 = getRandomNumber(10, true);
      val = n1 * n2;
      sym = "×";
    } else if (op === "division") {
      n2 = getRandomInRange(1, 10);
      val = getRandomInRange(1, 10);
      n1 = n2 * val;
      sym = "÷";
    } else if (op === "addition") {
      n1 = getRandomNumber(limit);
      n2 = getRandomNumber(limit, true);
      val = n1 + n2;
      sym = "+";
    } else {
      n1 = getRandomNumber(limit);
      n2 = getRandomNumber(limit, true);
      if (n1 < n2) [n1, n2] = [n2, n1];
      val = n1 - n2;
      sym = "-";
    }
    return {
      display: `${n1} ${sym} ${n2}`,
      value: val,
      operation: op,
      num1: n1,
      num2: n2,
      operatorSymbol: sym,
    };
  };

  const generateQuestion = () => {
    const d = settings.value.difficulty;
    if (["basic", "medium", "tens"].includes(d)) {
      let l, r, lv, rv;
      const limit = ["medium", "tens"].includes(d) ? 100 : 20;

      if (["medium", "tens"].includes(d)) {
        l = generateExpression();
        r = generateExpression();
        lv = l.value;
        rv = r.value;
      } else {
        const rand = Math.random();
        if (rand < 0.3) {
          l = generateExpression();
          r = generateExpression();
        } else if (rand < 0.7) {
          l = generateExpression();
          rv = getRandomNumber(limit);
          r = { display: String(rv), value: rv };
        } else {
          lv = getRandomNumber(limit);
          l = { display: String(lv), value: lv };
          r = generateExpression();
        }
        lv = l.value;
        rv = r.value;
      }
      const op = lv < rv ? "<" : lv > rv ? ">" : "=";
      return {
        id: `q-${Date.now()}-${++idCounter}`,
        num1: l.display,
        num2: r.display,
        leftValue: lv,
        rightValue: rv,
        correctOperator: op,
        answer: op,
        userAnswer: "",
        hasExpression: true,
        leftSide: l,
        rightSide: r,
      };
    }
    const n1 = getRandomNumber(),
      n2 = getRandomNumber(undefined, true);
    const op = n1 < n2 ? "<" : n1 > n2 ? ">" : "=";
    return {
      id: `q-${Date.now()}-${++idCounter}`,
      num1: n1,
      num2: n2,
      correctOperator: op,
      answer: op,
      userAnswer: "",
      hasExpression: false,
    };
  };

  const generateQuestions = async () => {
    const availableOperations = settings.value.operations || ["none"];
    const edgeCaseTracker = {};

    questions.value = await generateUniqueItems({
      count: settings.value.count,
      generateItem: generateQuestion,
      getKey: (q) =>
        q.hasExpression
          ? `${q.leftValue}:${q.rightValue}:${q.correctOperator}:${q.num1}:${q.num2}`
          : `${q.num1}:${q.num2}:${q.correctOperator}`,
      isValid: (question) => {
        if (
          !["basic", "medium", "tens"].includes(settings.value.difficulty) ||
          !question.hasExpression
        ) {
          return true;
        }

        const difficulty = settings.value.difficulty;
        const isAdvanced = ["medium", "tens"].includes(difficulty);

        if (isAdvanced) {
          const diff = Math.abs(question.leftValue - question.rightValue);
          const avgValue = (question.leftValue + question.rightValue) / 2;
          const hasDivision =
            question.leftSide?.operation === "division" ||
            question.rightSide?.operation === "division";

          if (!hasDivision) {
            const minAccepted = difficulty === "tens" ? 10 : 30;
            const maxAccepted = difficulty === "tens" ? 200 : 80;

            if (
              diff > avgValue * 0.4 ||
              question.leftValue < minAccepted ||
              question.rightValue < minAccepted ||
              question.leftValue > maxAccepted ||
              question.rightValue > maxAccepted
            ) {
              return false;
            }
            if (question.leftSide.num1 < 10 && question.leftSide.num2 < 10)
              return false;
            if (question.rightSide.num1 < 10 && question.rightSide.num2 < 10)
              return false;
          } else if (diff > avgValue * 0.5) {
            return false;
          }
        }

        // Check side expressions for edge cases
        const checkSide = (side, trackerPrefix) => {
          if (!side?.operatorSymbol) return true;

          const tracker = {};
          Object.keys(edgeCaseTracker)
            .filter((k) => k.startsWith(trackerPrefix))
            .forEach(
              (k) =>
                (tracker[k.replace(trackerPrefix, "")] = edgeCaseTracker[k]),
            );

          const result = checkEdgeCases(side, availableOperations, tracker);
          if (result.shouldSkip) return false;

          // Update global tracker with side findings
          Object.keys(tracker).forEach(
            (k) => (edgeCaseTracker[`${trackerPrefix}${k}`] = tracker[k]),
          );
          return true;
        };

        return (
          checkSide(question.leftSide, "left_") &&
          checkSide(question.rightSide, "right_")
        );
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
