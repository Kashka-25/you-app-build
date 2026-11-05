import { describe, expect, it } from "vitest";
import { reflectionQuestions, questionOfTheWeek } from "./compass";

const rows = [
  { reflection_question: "Newest?", suggested_next_step: "Step A", created_at: "2026-10-22T09:00:00" },
  { reflection_question: "Newest?", suggested_next_step: "Dup", created_at: "2026-10-21T09:00:00" },
  { reflection_question: "", suggested_next_step: "No question", created_at: "2026-10-20T09:00:00" },
  { reflection_question: "Older?", suggested_next_step: "", created_at: "2026-10-18T09:00:00" },
  { reflection_question: "Oldest?", suggested_next_step: "Step C", created_at: "2026-10-04T09:00:00" }
];

describe("reflectionQuestions", () => {
  it("keeps each question once, newest first, with its own step", () => {
    const list = reflectionQuestions(rows);
    expect(list.map(q => q.question)).toEqual(["Newest?", "Older?", "Oldest?"]);
    expect(list[0].step).toBe("Step A");
    expect(list[1].step).toBe(null);
  });
});

describe("questionOfTheWeek", () => {
  const list = reflectionQuestions(rows);

  it("shows a reflection made this week first", () => {
    expect(questionOfTheWeek(list, "2026-10-19")).toBe(0);
  });

  it("stays the same within a week and moves on the next", () => {
    const a = questionOfTheWeek(list, "2026-11-02");
    const b = questionOfTheWeek(list, "2026-11-09");
    expect(a).toBe(questionOfTheWeek(list, "2026-11-02"));
    expect(b).toBe((a + 1) % list.length);
  });

  it("copes with no questions", () => {
    expect(questionOfTheWeek([], "2026-11-02")).toBe(0);
  });
});
