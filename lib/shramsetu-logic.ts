export type WorkerSkill = "Mason" | "Painter" | "Electrician";
export type JobFilter = "All" | "Mason" | "Painter";

export type Job = {
  id: string;
  contractor: string;
  reliability: number;
  match: number;
  title: string;
  location: string;
  salary: string;
  duration: string;
  skill: Exclude<WorkerSkill, "Electrician">;
  initial: string;
};

export const jobs: Job[] = [
  {
    id: "abc-construction",
    contractor: "ABC Construction",
    reliability: 91,
    match: 94,
    title: "Senior Mason Required",
    location: "Gomti Nagar, Lucknow • 2.4 km",
    salary: "₹950/din",
    duration: "45 din",
    skill: "Mason",
    initial: "A",
  },
  {
    id: "buildright-contractors",
    contractor: "BuildRight Contractors",
    reliability: 84,
    match: 82,
    title: "Painter for Residential Project",
    location: "Hazratganj, Lucknow • 4.8 km",
    salary: "₹800/din",
    duration: "20 din",
    skill: "Painter",
    initial: "B",
  },
];

const wageBases: Record<WorkerSkill, { min: number; max: number }> = {
  Mason: { min: 850, max: 1050 },
  Painter: { min: 700, max: 900 },
  Electrician: { min: 950, max: 1200 },
};

export function validateDemoOtp(code: string) {
  return code === "1234";
}

export function getFairWageRange(skill: WorkerSkill, years: number) {
  const base = wageBases[skill];
  const boundedYears = Math.max(1, Math.min(20, years));
  const adjustment = (boundedYears - 7) * 45;
  return {
    min: Math.max(450, base.min + adjustment),
    max: Math.max(600, base.max + adjustment),
  };
}

export function filterJobs(query: string, filter: JobFilter) {
  const normalizedQuery = query.trim().toLowerCase();
  return jobs.filter((job) => {
    const matchesSkill = filter === "All" || job.skill === filter;
    const searchable = `${job.contractor} ${job.title} ${job.skill} ${job.location}`.toLowerCase();
    return matchesSkill && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}
