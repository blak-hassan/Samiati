import { test, expect } from "@playwright/test";
import { mockAiEnabled, assertMockDisabledInProduction } from "../env/guard";

test.describe("Mock AI production-disable guard", () => {
  test("mockAiEnabled returns disabled under NODE_ENV=production", () => {
    const orig = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const result = mockAiEnabled();
      expect(result.enabled).toBe(false);
      expect(result.reason).toContain("production");
    } finally {
      process.env.NODE_ENV = orig;
    }
  });

  test("mockAiEnabled returns disabled when QA_MOCK_AI is not '1'", () => {
    const origEnv = process.env.NODE_ENV;
    const origQa = process.env.QA_MOCK_AI;
    process.env.NODE_ENV = "development";
    process.env.QA_MOCK_AI = "0";
    try {
      const result = mockAiEnabled();
      expect(result.enabled).toBe(false);
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.QA_MOCK_AI = origQa;
    }
  });

  test("mockAiEnabled returns enabled only when both conditions hold", () => {
    const origEnv = process.env.NODE_ENV;
    const origQa = process.env.QA_MOCK_AI;
    process.env.NODE_ENV = "development";
    process.env.QA_MOCK_AI = "1";
    try {
      const result = mockAiEnabled();
      expect(result.enabled).toBe(true);
      expect(result.reason).toContain("mock AI enabled");
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.QA_MOCK_AI = origQa;
    }
  });

  test("assertMockDisabledInProduction does not throw", () => {
    expect(() => assertMockDisabledInProduction()).not.toThrow();
  });
});
