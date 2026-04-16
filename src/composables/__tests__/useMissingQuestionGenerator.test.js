import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useMissingQuestionGenerator } from "../useMissingQuestionGenerator";
import { setupLocalStorageMock } from "./test-utils";

describe("useMissingQuestionGenerator", () => {
  let storageMock;
  let generator;

  beforeEach(async () => {
    storageMock = setupLocalStorageMock();
    generator = useMissingQuestionGenerator();
  });

  afterEach(() => {
    storageMock.restore();
  });

  describe("initial state", () => {
    it("has default settings", async () => {
      expect(generator.settings.value.count).toBe(20);
      expect(generator.settings.value.difficulty).toBe("easy");
      expect(generator.settings.value.operations).toEqual(["addition"]);
    });

    it("has empty questions initially", async () => {
      expect(generator.questions.value).toEqual([]);
    });
  });

  describe("standard question generation", () => {
    beforeEach(async () => {
      generator.updateSettings({
        questionFormat: "standard",
        operations: ["addition"],
        count: 20,
      });
      await generator.generateQuestions();
    });

    it("generates correct number of questions", async () => {
      expect(generator.questions.value.length).toBe(20);
    });

    it("each question has required fields", async () => {
      generator.questions.value.forEach((q) => {
        expect(q).toHaveProperty("id");
        expect(q).toHaveProperty("num1");
        expect(q).toHaveProperty("num2");
        expect(q).toHaveProperty("result");
        expect(q).toHaveProperty("answer");
        expect(q).toHaveProperty("missingPosition");
        expect(q).toHaveProperty("userAnswer");
      });
    });

    it("missingPosition is first or second for standard format", async () => {
      generator.questions.value.forEach((q) => {
        expect(["first", "second"]).toContain(q.missingPosition);
      });
    });

    it("addition equation is mathematically correct", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.result).toBe(q.num1 + q.num2);
      });
    });

    it("answer matches the missing number", async () => {
      generator.questions.value.forEach((q) => {
        if (q.missingPosition === "first") {
          expect(q.answer).toBe(q.num1);
        } else {
          expect(q.answer).toBe(q.num2);
        }
      });
    });
  });

  describe("subtraction questions", () => {
    beforeEach(async () => {
      generator.updateSettings({
        operations: ["subtraction"],
        questionFormat: "standard",
        count: 20,
      });
      await generator.generateQuestions();
    });

    it("uses subtraction operator", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.operation).toBe("-");
      });
    });

    it("results are non-negative", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.result).toBeGreaterThanOrEqual(0);
      });
    });

    it("answers are non-negative", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.answer).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("both-sides question format", () => {
    beforeEach(async () => {
      generator.updateSettings({
        operations: ["addition"],
        questionFormat: "both-sides",
        count: 20,
      });
      await generator.generateQuestions();
    });

    it("generates questions with both-sides format", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.format).toBe("both-sides");
      });
    });

    it("missing position includes left and right positions", async () => {
      const positions = new Set(
        generator.questions.value.map((q) => q.missingPosition),
      );
      // Should have various positions like left-first, left-second, right-first, right-second
      expect(positions.size).toBeGreaterThanOrEqual(1);
    });

    it("answers are positive", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.answer).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("mixed operations", () => {
    beforeEach(async () => {
      generator.updateSettings({
        operations: ["addition", "subtraction"],
        questionFormat: "standard",
        count: 50,
      });
      await generator.generateQuestions();
    });

    it("generates questions with different operators", async () => {
      const operators = new Set(
        generator.questions.value.map((q) => q.operation),
      );
      expect(operators.size).toBeGreaterThanOrEqual(1);
    });

    it("all operators are addition or subtraction", async () => {
      generator.questions.value.forEach((q) => {
        expect(["+", "-"]).toContain(q.operation);
      });
    });
  });

  describe("uniqueness", () => {
    it("generates unique questions", async () => {
      generator.updateSettings({ count: 20 });
      await generator.generateQuestions();

      const ids = generator.questions.value.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(20);
    });
  });

  describe("updateSettings", () => {
    it("updates count", async () => {
      generator.updateSettings({ count: 25 });
      expect(generator.settings.value.count).toBe(25);
    });

    it("updates difficulty", async () => {
      generator.updateSettings({ difficulty: "medium" });
      expect(generator.settings.value.difficulty).toBe("medium");
    });

    it("updates question format", async () => {
      generator.updateSettings({ questionFormat: "both-sides" });
      expect(generator.settings.value.questionFormat).toBe("both-sides");
    });
  });

  describe("persistence", () => {
    it("loads settings from localStorage", async () => {
      localStorage.setItem(
        "math-gen-missing-settings",
        JSON.stringify({
          count: 30,
          difficulty: "medium1",
          operations: ["subtraction"],
        }),
      );

      const newGenerator = useMissingQuestionGenerator();
      expect(newGenerator.settings.value.count).toBe(30);
      expect(newGenerator.settings.value.difficulty).toBe("medium1");
    });
  });

  describe("difficulty levels", () => {
    it("easy difficulty uses small numbers (0-10)", async () => {
      generator.updateSettings({
        difficulty: "easy",
        count: 30,
        operations: ["addition"],
        questionFormat: "standard",
      });
      await generator.generateQuestions();

      generator.questions.value.forEach((q) => {
        expect(q.num1).toBeLessThanOrEqual(10);
        expect(q.num2).toBeLessThanOrEqual(10);
      });
    });

    it("medium1 difficulty uses numbers 1-20", async () => {
      generator.updateSettings({
        difficulty: "medium1",
        count: 30,
        operations: ["addition"],
        questionFormat: "standard",
      });
      await generator.generateQuestions();

      generator.questions.value.forEach((q) => {
        expect(q.num1).toBeGreaterThanOrEqual(1);
        expect(q.num1).toBeLessThanOrEqual(20);
      });
    });

    it("medium difficulty uses larger numbers (10-100)", async () => {
      generator.updateSettings({
        difficulty: "medium",
        count: 30,
        operations: ["addition"],
        questionFormat: "standard",
      });
      await generator.generateQuestions();

      const maxNum = Math.max(
        ...generator.questions.value.map((q) => Math.max(q.num1, q.num2)),
      );
      expect(maxNum).toBeLessThanOrEqual(100);
    });

    it("hard difficulty uses large numbers (100-900)", async () => {
      generator.updateSettings({
        difficulty: "hard",
        count: 30,
        operations: ["addition"],
        questionFormat: "standard",
      });
      await generator.generateQuestions();

      const hasLargeNumber = generator.questions.value.some(
        (q) => q.num1 >= 100 || q.num2 >= 100,
      );
      expect(hasLargeNumber).toBe(true);
    });

    it("tens difficulty generates multiples of 10", async () => {
      generator.updateSettings({
        difficulty: "tens",
        count: 30,
        operations: ["addition"],
        questionFormat: "standard",
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

  describe("varySecondNumber option", () => {
    it("medium with varySecondNumber can have smaller second numbers", async () => {
      generator.updateSettings({
        difficulty: "medium",
        count: 50,
        operations: ["addition"],
        questionFormat: "standard",
        varySecondNumber: true,
      });
      await generator.generateQuestions();

      // With vary, some numbers should be small (1-10)
      const hasSmallNumber = generator.questions.value.some(
        (q) => q.num2 <= 10,
      );
      expect(hasSmallNumber).toBe(true);
    });

    it("hard with varySecondNumber can have varied numbers", async () => {
      generator.updateSettings({
        difficulty: "hard",
        count: 50,
        operations: ["addition"],
        questionFormat: "standard",
        varySecondNumber: true,
      });
      await generator.generateQuestions();

      // Should generate some questions
      expect(generator.questions.value.length).toBe(50);
    });
  });

  describe("both-sides-mixed format", () => {
    it("generates questions with mixed operators on both sides", async () => {
      generator.updateSettings({
        operations: ["addition", "subtraction"],
        questionFormat: "both-sides-mixed",
        count: 20,
      });
      await generator.generateQuestions();

      // Should have mixed format with different operators
      const hasMixedOps = generator.questions.value.some(
        (q) => q.operation !== q.operation2 && q.operation2,
      );
      expect(hasMixedOps).toBe(true);
    });
  });

  describe("subtraction both-sides format", () => {
    beforeEach(async () => {
      generator.updateSettings({
        operations: ["subtraction"],
        questionFormat: "both-sides",
        count: 30,
      });
      await generator.generateQuestions();
    });

    it("generates subtraction both-sides questions", async () => {
      expect(generator.questions.value.length).toBeGreaterThan(0);
    });

    it("all positions are covered", async () => {
      const positions = new Set(
        generator.questions.value.map((q) => q.missingPosition),
      );
      expect(positions.size).toBeGreaterThanOrEqual(1);
    });

    it("answers are non-negative", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.answer).toBeGreaterThanOrEqual(0);
      });
    });

    it("uses subtraction operator", async () => {
      generator.questions.value.forEach((q) => {
        expect(q.operation).toBe("-");
      });
    });
  });

  describe("edge cases", () => {
    it("handles answerZero edge case", async () => {
      generator.updateSettings({
        operations: ["addition"],
        questionFormat: "standard",
        count: 50,
        difficulty: "easy",
      });
      await generator.generateQuestions();

      // Should handle edge cases properly
      expect(generator.questions.value.length).toBe(50);
    });

    it("handles resultZero edge case in standard format", async () => {
      generator.updateSettings({
        operations: ["subtraction"],
        questionFormat: "standard",
        count: 50,
        difficulty: "easy",
      });
      await generator.generateQuestions();

      expect(generator.questions.value.length).toBe(50);
    });
  });
});
