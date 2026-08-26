import { describe, expect, it } from "vitest";

import { copy } from "../lib/shramsetu-copy";
import { createLocalJob, filterJobs, financeSeries, getChartMaximum, getFairWageRange, jobs, sortJobs, validateDemoOtp } from "../lib/shramsetu-logic";

describe("ShramSetu demo flow logic", () => {
  it("accepts only the seeded demo OTP", () => {
    expect(validateDemoOtp("1234")).toBe(true);
    expect(validateDemoOtp("0000")).toBe(false);
  });

  it("returns the expected fair wage range for a seven-year mason", () => {
    expect(getFairWageRange("Mason", 7)).toEqual({ min: 850, max: 1050 });
  });

  it("exposes complete labels for both app languages", () => {
    expect(copy.Hindi.phoneTitle).toBeTruthy();
    expect(copy.English.phoneTitle).toBeTruthy();
    expect(copy.English.jobs).toBe("Jobs");
  });

  it("filters verified work by skill and free-text search", () => {
    expect(filterJobs(jobs, "", "Mason")).toHaveLength(1);
    expect(filterJobs(jobs, "hazratganj", "All")[0]?.skill).toBe("Painter");
  });

  it("orders available work by distance when a worker chooses nearby jobs", () => {
    expect(sortJobs([jobs[1], jobs[0]], "nearest").map((job) => job.id)).toEqual(["abc-construction", "buildright-contractors"]);
  });

  it("creates a local job that immediately becomes searchable in the feed", () => {
    const localJob = createLocalJob({ contractor: "Sunrise Builders", title: "Electrician needed", location: "Indira Nagar, Lucknow", salary: 1100, duration: 30, skill: "Electrician" }, "local-1");
    expect(filterJobs([localJob, ...jobs], "sunrise", "All")[0]?.id).toBe("local-1");
    expect(localJob.skill).toBe("Electrician");
    expect(localJob.contractorTrust.verified).toBe(false);
  });

  it("provides valid finance data for the weekly and monthly chart", () => {
    expect(financeSeries.week).toHaveLength(7);
    expect(financeSeries.month).toHaveLength(4);
    expect(getChartMaximum(financeSeries.week)).toBeGreaterThan(0);
  });
});
