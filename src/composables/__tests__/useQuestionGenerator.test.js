import { describe, it, expect, beforeEach } from "vitest";
import { useQuestionGenerator } from "../useQuestionGenerator";

describe("useQuestionGenerator", () => {
  let generator;

  beforeEach(async () => {
    generator = useQuestionGenerator();
  });

  describe("initial state", () => {
    it("has empty questions array", async () => {
      expect(generator.questions.value).toEqual([]);
    });

    it("has default settings", async () => {
      expect(generator.settings.value).toEqual({
        count: 20,
        difficulty: "easy",
        operation: "addition",
        showAnswers: false,
      });
    });
  });

  describe("updateSettings", () => {
    it("updates partial settings", async () => {
      generator.updateSettings({ difficulty: "hard" });
      expect(generator.settings.value.difficulty).toBe("hard");
      expect(generator.settings.value.count).toBe(20); // unchanged
    });

    it("updates multiple settings at once", async () => {
      generator.updateSettings({ difficulty: "medium", count: 30 });
      expect(generator.settings.value.difficulty).toBe("medium");
      expect(generator.settings.value.count).toBe(30);
    });
  });

  describe("generateQuestions", () => {
    it("generates the correct number of questions", async () => {
      generator.updateSettings({ count: 10 });
      await generator.generateQuestions();
      expect(generator.questions.value.length).toBe(10);
    });

    it("generates questions with unique IDs", async () => {
      generator.updateSettings({ count: 10 });
      await generator.generateQuestions();

      const ids = generator.questions.value.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });

    it("generates unique questions (no duplicates)", async () => {
      generator.updateSettings({ count: 15 });
      await generator.generateQuestions();

      const keys = generator.questions.value.map(
        (q) => `${q.num1}${q.operation}${q.num2}`,
      );
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(15);
    });
  });

  describe("addition questions", () => {
    beforeEach(async () => {
      generator.updateSettings({ operation: "addition", count: 20 });
      await generator.generateQuestions();
    });

    it("uses + operator", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.operation).toBe("+");
      });
    });

    it("calculates correct answers", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.answer).toBe(q.num1 + q.num2);
      });
    });
  });

  describe("subtraction questions", () => {
    beforeEach(async () => {
      generator.updateSettings({ operation: "subtraction", count: 20 });
      await generator.generateQuestions();
    });

    it("uses - operator", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.operation).toBe("-");
      });
    });

    it("ensures num1 >= num2 (no negative results)", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.num1).toBeGreaterThanOrEqual(q.num2);
      });
    });

    it("calculates correct answers", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.answer).toBe(q.num1 - q.num2);
      });
    });
  });

  describe("multiplication questions", () => {
    beforeEach(async () => {
      generator.updateSettings({ operation: "multiplication", count: 20 });
      await generator.generateQuestions();
    });

    it("uses × operator", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.operation).toBe("×");
      });
    });

    it("calculates correct answers", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.answer).toBe(q.num1 * q.num2);
      });
    });
  });

  describe("division questions", () => {
    beforeEach(async () => {
      generator.updateSettings({ operation: "division", count: 20 });
      await generator.generateQuestions();
    });

    it("uses ÷ operator", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.operation).toBe("÷");
      });
    });

    it("has integer answers (clean divisibility)", async () => {
      generator.questions.value.forEach((q) => {
        expect(Number.isInteger(q.answer)).toBe(true);
      });
    });

    it("calculates correct answers", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.answer).toBe(q.num1 / q.num2);
      });
    });

    it("does not divide by zero", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.num2).toBeGreaterThan(0);
      });
    });
  });

  describe("difficulty levels", () => {
    it("easy difficulty generates numbers 0-10", async () => {
      generator.updateSettings({
        difficulty: "easy",
        count: 50,
        operation: "addition",
      });
      await generator.generateQuestions();

      generator.questions.value.forEach((q) => {
        expect(q.num1).toBeGreaterThanOrEqual(0);
        expect(q.num1).toBeLessThanOrEqual(10);
        expect(q.num2).toBeGreaterThanOrEqual(0);
        expect(q.num2).toBeLessThanOrEqual(10);
      });
    });

    it("beginners difficulty generates numbers 0-10", async () => {
      generator.updateSettings({
        difficulty: "beginners",
        count: 50,
        operation: "addition",
      });
      await generator.generateQuestions();

      generator.questions.value.forEach((q) => {
        expect(q.num1).toBeGreaterThanOrEqual(0);
        expect(q.num1).toBeLessThanOrEqual(10);
      });
    });

    it("basic difficulty generates numbers up to 20", async () => {
      generator.updateSettings({
        difficulty: "basic",
        count: 50,
        operation: "addition",
      });
      await generator.generateQuestions();

      const maxNum = Math.max(
        ...generator.questions.value.flatMap((q) => [q.num1, q.num2]),
      );
      expect(maxNum).toBeLessThanOrEqual(20);
    });

    it("medium difficulty generates numbers up to 100", async () => {
      generator.updateSettings({
        difficulty: "medium",
        count: 50,
        operation: "addition",
      });
      await generator.generateQuestions();

      const maxNum = Math.max(
        ...generator.questions.value.flatMap((q) => [q.num1, q.num2]),
      );
      expect(maxNum).toBeLessThanOrEqual(100);
    });

    it("hard difficulty generates numbers up to 1000", async () => {
      generator.updateSettings({
        difficulty: "hard",
        count: 50,
        operation: "addition",
      });
      await generator.generateQuestions();

      const maxNum = Math.max(
        ...generator.questions.value.flatMap((q) => [q.num1, q.num2]),
      );
      expect(maxNum).toBeLessThanOrEqual(1000);
    });

    it("tens difficulty generates multiples of 10", async () => {
      generator.updateSettings({
        difficulty: "tens",
        count: 50,
        operation: "addition",
      });
      await generator.generateQuestions();

      generator.questions.value.forEach((q) => {
        expect(q.num1 % 10).toBe(0);
        expect(q.num2 % 10).toBe(0);
        expect(q.num1).toBeGreaterThanOrEqual(10);
        expect(q.num2).toBeGreaterThanOrEqual(10);
      });
    });
  });
});
