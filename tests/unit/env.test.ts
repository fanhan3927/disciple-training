import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("provides safe defaults for disabled MVP feature flags", () => {
    const env = parseEnv({});

    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3100");
    expect(env.ENABLE_AI).toBe(false);
    expect(env.ENABLE_GROUP_POSTS).toBe(false);
    expect(env.ENABLE_PRAYERS).toBe(false);
  });
});
