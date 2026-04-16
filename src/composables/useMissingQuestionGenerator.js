import { ref, watch } from "vue";
import { useLocalStorage } from "./useLocalStorage";

let idCounter = 0;
const settingsStorage = useLocalStorage("math-gen-missing-settings");
const questionsStorage = useLocalStorage("math-gen-missing-questions", []);

export function useMissingQuestionGenerator() {
  const questions = ref(questionsStorage.load());
  const savedSettings = settingsStorage.load();
  const settings = ref({
    count: 20,
    difficulty: "easy",
    operations: ["addition"],
    questionFormat: "standard",
    varySecondNumber: false,
    ...(savedSettings || {}),
  });

  watch(settings, (s) => settingsStorage.save(s), { deep: true });
  watch(questions, (q) => questionsStorage.save(q), { deep: true });

  const getRand = (limit = 0) => {
    const { difficulty: d, varySecondNumber: v } = settings.value;
    let [min, max] = [0, 10];
    if (d === "medium1") [min, max] = [1, 20];
    else if (d === "medium")
      [min, max] = limit && v && Math.random() < 0.5 ? [1, 10] : [10, 100];
    else if (d === "hard")
      [min, max] =
        limit && v ? (Math.random() < 0.5 ? [1, 10] : [10, 100]) : [100, 900];
    else if (d === "tens") return (Math.floor(Math.random() * 20) + 1) * 10;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const genSide = (op) => {
    let n1 = getRand(),
      n2 = getRand(1);
    if (op === "addition" || op === "+")
      return { n1, n2, val: n1 + n2, sym: "+" };
    if (n1 < n2) [n1, n2] = [n2, n1];
    return { n1, n2, val: n1 - n2, sym: "-" };
  };

  const generateQuestion = () => {
    const { operations: ops, questionFormat: f } = settings.value;
    const op1 = ops[Math.floor(Math.random() * ops.length)];
    const op2 = ops[Math.floor(Math.random() * ops.length)];
    const id = `q-${Date.now()}-${++idCounter}`;

    if (f === "standard") {
      const { n1, n2, val, sym } = genSide(op1);
      const pos = Math.random() < 0.5 ? "first" : "second";
      return {
        id,
        num1: n1,
        num2: n2,
        result: val,
        answer: pos === "first" ? n1 : n2,
        operation: sym,
        missingPosition: pos,
        format: "standard",
        userAnswer: "",
      };
    }

    let l = genSide(op1),
      r = genSide(op2),
      attempts = 0;
    while (l.val !== r.val && attempts++ < 100) r = genSide(op2);
    if (l.val !== r.val) r = { n1: l.val, n2: 0, val: l.val, sym: r.sym }; // Fallback with same operator but simple arithmetic

    const pos = ["left-first", "left-second", "right-first", "right-second"][
      Math.floor(Math.random() * 4)
    ];
    const ans =
      pos === "left-first"
        ? l.n1
        : pos === "left-second"
          ? l.n2
          : pos === "right-first"
            ? r.n1
            : r.n2;
    return {
      id,
      num1: l.n1,
      num2: l.n2,
      num3: r.n1,
      num4: r.n2,
      answer: ans,
      operation: l.sym,
      operation2: r.sym,
      format: "both-sides",
      missingPosition: pos,
      userAnswer: "",
    };
  };

  const generateQuestions = async () => {
    const res = [],
      seen = new Set();
    const maxAttempts = settings.value.count * 10;
    let attempts = 0;

    while (res.length < settings.value.count && attempts < maxAttempts) {
      attempts++;
      const q = generateQuestion();
      const key = `${q.format}-${q.num1}-${q.operation}-${q.num2}-${q.num3}-${q.operation2}-${q.num4}-${q.missingPosition}`;
      if (!seen.has(key)) {
        seen.add(key);
        res.push(q);
      }

      // Yield every 50 questions to keep UI responsive
      if (res.length % 50 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    questions.value = res;
  };

  return {
    questions,
    settings,
    generateQuestions,
    updateSettings: (s) => (settings.value = { ...settings.value, ...s }),
  };
}
