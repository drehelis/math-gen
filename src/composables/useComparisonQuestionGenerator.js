import { ref, watch } from "vue";
import { checkEdgeCases } from "./useEdgeCaseRules";
import { useLocalStorage } from "./useLocalStorage";

let idCounter = 0;

const settingsStorage = useLocalStorage("math-gen-comparison-settings");
const questionsStorage = useLocalStorage("math-gen-comparison-questions", []);

export function useComparisonQuestionGenerator() {
  const questions = ref(questionsStorage.load());
  const savedSettings = settingsStorage.load();

  let initialSettings = {
    count: 20,
    difficulty: "beginners",
    operation: "none",
    operations: ["none"],
    showAnswers: false,
  };

  if (savedSettings) {
    initialSettings = {
      ...initialSettings,
      ...savedSettings,
    };
  }

  const settings = ref(initialSettings);

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

  const getRandomNumber = (max) => {
    const d = settings.value.difficulty;
    let [min, maxVal] = [0, max || 10];
    if (d === "tens") {
      min = 10;
      maxVal = max || 200;
      return (
        Math.floor(Math.random() * (Math.floor((maxVal - 10) / 10) + 1)) * 10 +
        10
      );
    }
    if (!max) {
      if (d === "beginners") [min, maxVal] = [0, 10];
      else if (d === "basic" || d === "medium") [min, maxVal] = [1, 20];
      else if (d === "easy") [min, maxVal] = [1, 10];
    }
    return Math.floor(Math.random() * (maxVal - min + 1)) + min;
  };

  const generateExpression = () => {
    const ops = settings.value.operations || ["addition"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const limit = settings.value.difficulty === "medium" ? 100 : 20;
    let n1, n2, val, sym;

    if (op === "multiplication") {
      n1 = getRandomNumber(10);
      n2 = getRandomNumber(10);
      val = n1 * n2;
      sym = "×";
    } else if (op === "division") {
      n2 = Math.floor(Math.random() * 10) + 1;
      val = Math.floor(Math.random() * 10) + 1;
      n1 = n2 * val;
      sym = "÷";
    } else if (op === "addition") {
      n1 = getRandomNumber(limit);
      n2 = getRandomNumber(limit);
      val = n1 + n2;
      sym = "+";
    } else {
      n1 = getRandomNumber(limit);
      n2 = getRandomNumber(limit);
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
    if (d === "basic" || d === "medium" || d === "tens") {
      let l, r, lv, rv;
      const limit = d === "medium" || d === "tens" ? 100 : 20;

      if (d === "medium" || d === "tens") {
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
      n2 = getRandomNumber();
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
    const newQuestions = [];
    const seen = new Set();
    const maxAttempts = settings.value.count * 10;
    let attempts = 0;
    const edgeCaseTracker = {};
    const availableOperations = settings.value.operations || ["none"];

    while (
      newQuestions.length < settings.value.count &&
      attempts < maxAttempts
    ) {
      attempts++;
      const question = generateQuestion();

      // Check edge cases for basic and medium difficulty with expressions
      if (
        (settings.value.difficulty === "basic" ||
          settings.value.difficulty === "medium" ||
          settings.value.difficulty === "tens") &&
        question.hasExpression
      ) {
        let shouldSkip = false;

        // For medium difficulty, check if values are too far apart (makes comparison too obvious)
        if (
          settings.value.difficulty === "medium" ||
          settings.value.difficulty === "tens"
        ) {
          const diff = Math.abs(question.leftValue - question.rightValue);
          const avgValue = (question.leftValue + question.rightValue) / 2;

          // Only apply range checks if not using division (division has smaller results)
          const hasDivision =
            (question.leftSide && question.leftSide.operation === "division") ||
            (question.rightSide && question.rightSide.operation === "division");

          if (!hasDivision) {
            // Skip if difference is more than 40% of average, or if values are outside 30-80 range
            if (
              diff > avgValue * 0.4 ||
              question.leftValue < 30 ||
              question.rightValue < 30 ||
              question.leftValue > 80 ||
              question.rightValue > 80
            ) {
              shouldSkip = true;
            }

            // Skip if either side has very small numbers (< 10) that make it trivial
            if (question.leftSide.num1 < 10 && question.leftSide.num2 < 10) {
              shouldSkip = true;
            }
            if (question.rightSide.num1 < 10 && question.rightSide.num2 < 10) {
              shouldSkip = true;
            }
          } else {
            // For division, just check if difference is too obvious (more than 50% of average)
            if (diff > avgValue * 0.5) {
              shouldSkip = true;
            }
          }
        }

        if (shouldSkip) continue;

        // Check left side if it has an expression
        if (question.leftSide && question.leftSide.operatorSymbol) {
          const leftTracker = {};
          Object.keys(edgeCaseTracker)
            .filter((key) => key.startsWith("left_"))
            .forEach((key) => {
              leftTracker[key.replace("left_", "")] = edgeCaseTracker[key];
            });

          const result = checkEdgeCases(
            question.leftSide,
            availableOperations,
            leftTracker,
          );
          if (result.shouldSkip) {
            shouldSkip = true;
          } else {
            Object.keys(leftTracker).forEach((key) => {
              edgeCaseTracker[`left_${key}`] = leftTracker[key];
            });
          }
        }

        // Check right side if it has an expression
        if (
          !shouldSkip &&
          question.rightSide &&
          question.rightSide.operatorSymbol
        ) {
          const rightTracker = {};
          Object.keys(edgeCaseTracker)
            .filter((key) => key.startsWith("right_"))
            .forEach((key) => {
              rightTracker[key.replace("right_", "")] = edgeCaseTracker[key];
            });

          const result = checkEdgeCases(
            question.rightSide,
            availableOperations,
            rightTracker,
          );
          if (result.shouldSkip) {
            shouldSkip = true;
          } else {
            Object.keys(rightTracker).forEach((key) => {
              edgeCaseTracker[`right_${key}`] = rightTracker[key];
            });
          }
        }

        if (shouldSkip) continue;
      }

      const key = question.hasExpression
        ? `${question.leftValue}:${question.rightValue}:${question.correctOperator}:${question.num1}:${question.num2}`
        : `${question.num1}:${question.num2}:${question.correctOperator}`;

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
