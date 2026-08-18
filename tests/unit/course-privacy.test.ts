import { describe, expect, it } from "vitest";
import { getJsonText, getPromptText, getWeekFromSequence } from "@/features/courses/content";
import { getVisibilityNotice, hasActiveShare } from "@/features/courses/privacy";

describe("course content helpers", () => {
  it("extracts safe text from structured JSON blocks", () => {
    expect(getJsonText({ text: "产品化摘要" })).toBe("产品化摘要");
    expect(getJsonText("raw")).toBe("");
    expect(getPromptText({ prompt: "完成任务" })).toBe("完成任务");
  });

  it("clamps week numbers to the four-week MVP", () => {
    expect(getWeekFromSequence(0)).toBe(1);
    expect(getWeekFromSequence(3)).toBe(3);
    expect(getWeekFromSequence(9)).toBe(4);
  });
});

describe("entry privacy helpers", () => {
  it("defaults visibility copy to private", () => {
    expect(getVisibilityNotice("private")).toContain("仅你自己");
    expect(getVisibilityNotice("leader_only")).toContain("Leader");
    expect(getVisibilityNotice("group")).toContain("当前小组");
  });

  it("treats revoked shares as inactive", () => {
    expect(
      hasActiveShare(
        [
          { share_scope: "group", revoked_at: "2026-07-31T00:00:00.000Z" },
          { share_scope: "leader_only", revoked_at: null },
        ],
        "group",
      ),
    ).toBe(false);
    expect(
      hasActiveShare(
        [
          { share_scope: "group", revoked_at: "2026-07-31T00:00:00.000Z" },
          { share_scope: "leader_only", revoked_at: null },
        ],
        "leader_only",
      ),
    ).toBe(true);
  });
});
