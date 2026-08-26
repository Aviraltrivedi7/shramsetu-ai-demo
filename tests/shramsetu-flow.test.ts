import { describe, expect, it } from "vitest";

import { filterJobs, getFairWageRange, validateDemoOtp } from "../lib/shramsetu-logic";

describe("ShramSetu demo flow logic", () => {
  it("accepts only the seeded demo OTP", () => {
    expect(validateDemoOtp("1234")).toBe(true);
    expect(validateDemoOtp("0000")).toBe(false);
  });

  it("returns the expected fair wage range for a seven-year mason", () => {
    expect(getFairWageRange("Mason", 7)).toEqual({ min: 850, max: 1050 });
  });

  it("adjusts estimates for experience and retains valid ordering", () => {
    const range = getFairWageRange("Electrician", 9);
    expect(range.min).toBe(1040);
    expect(range.max).toBe(1290);
    expect(range.min).toBeLessThan(range.max);
  });

  it("filters verified work by skill and free-text search", () => {
    expect(filterJobs("", "Mason")).toHaveLength(1);
    expect(filterJobs("hazratganj", "All")[0]?.skill).toBe("Painter");
  });
});
