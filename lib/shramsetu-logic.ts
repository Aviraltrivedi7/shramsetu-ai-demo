export type Language = "Hindi" | "English";
export type WorkerSkill = "Mason" | "Painter" | "Electrician";
export type JobFilter = "All" | WorkerSkill;
export type JobSort = "nearest" | "best-match";

export type LocalizedText = Record<Language, string>;

export type Job = {
  id: string;
  contractor: string;
  reliability: number;
  match: number;
  title: LocalizedText;
  location: LocalizedText;
  salary: number;
  duration: number;
  skill: WorkerSkill;
  initial: string;
  distanceKm: number;
  coordinates: { latitude: number; longitude: number };
  contractorTrust: {
    verified: boolean;
    paymentScore: number;
    responseRate: number;
    completedProjects: number;
    memberSince: string;
  };
};

export type NewJobInput = {
  contractor: string;
  title: string;
  location: string;
  salary: number;
  duration: number;
  skill: WorkerSkill;
};

export type FinancePoint = {
  label: string;
  income: number;
  expense: number;
};

export const jobs: Job[] = [
  {
    id: "abc-construction",
    contractor: "ABC Construction",
    reliability: 91,
    match: 94,
    title: { Hindi: "Senior Mason Required", English: "Senior Mason Required" },
    location: { Hindi: "Gomti Nagar, Lucknow • 2.4 km", English: "Gomti Nagar, Lucknow • 2.4 km" },
    salary: 950,
    duration: 45,
    skill: "Mason",
    initial: "A",
    distanceKm: 2.4,
    coordinates: { latitude: 26.8499, longitude: 80.9911 },
    contractorTrust: { verified: true, paymentScore: 96, responseRate: 92, completedProjects: 38, memberSince: "2021" },
  },
  {
    id: "buildright-contractors",
    contractor: "BuildRight Contractors",
    reliability: 84,
    match: 82,
    title: { Hindi: "Residential project ke liye Painter", English: "Painter for Residential Project" },
    location: { Hindi: "Hazratganj, Lucknow • 4.8 km", English: "Hazratganj, Lucknow • 4.8 km" },
    salary: 800,
    duration: 20,
    skill: "Painter",
    initial: "B",
    distanceKm: 4.8,
    coordinates: { latitude: 26.8467, longitude: 80.9462 },
    contractorTrust: { verified: true, paymentScore: 89, responseRate: 86, completedProjects: 19, memberSince: "2022" },
  },
];

export const financeSeries = {
  week: [
    { label: "Mon", income: 900, expense: 190 },
    { label: "Tue", income: 950, expense: 240 },
    { label: "Wed", income: 0, expense: 140 },
    { label: "Thu", income: 1050, expense: 310 },
    { label: "Fri", income: 950, expense: 220 },
    { label: "Sat", income: 950, expense: 350 },
    { label: "Sun", income: 0, expense: 110 },
  ] satisfies FinancePoint[],
  month: [
    { label: "W1", income: 4200, expense: 1120 },
    { label: "W2", income: 4800, expense: 1480 },
    { label: "W3", income: 3900, expense: 980 },
    { label: "W4", income: 5100, expense: 1690 },
  ] satisfies FinancePoint[],
};

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

export function filterJobs(jobList: Job[], query: string, filter: JobFilter) {
  const normalizedQuery = query.trim().toLowerCase();
  return jobList.filter((job) => {
    const matchesSkill = filter === "All" || job.skill === filter;
    const searchable = `${job.contractor} ${job.title.Hindi} ${job.title.English} ${job.skill} ${job.location.Hindi} ${job.location.English}`.toLowerCase();
    return matchesSkill && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}

export function sortJobs(jobList: Job[], sort: JobSort) {
  return [...jobList].sort((left, right) => {
    if (sort === "nearest") {
      return left.distanceKm - right.distanceKm || right.match - left.match;
    }
    return right.match - left.match || left.distanceKm - right.distanceKm;
  });
}

export function calculateDistanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180;
  const startLatitude = (from.latitude * Math.PI) / 180;
  const endLatitude = (to.latitude * Math.PI) / 180;
  const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function orderJobsForCurrentLocation(
  jobList: Job[],
  userLocation: { latitude: number; longitude: number } | null,
  sort: JobSort,
) {
  if (!userLocation) return sortJobs(jobList, sort);
  return [...jobList].sort((left, right) => {
    const leftDistance = calculateDistanceKm(userLocation, left.coordinates);
    const rightDistance = calculateDistanceKm(userLocation, right.coordinates);
    return sort === "nearest"
      ? leftDistance - rightDistance || right.match - left.match
      : right.match - left.match || leftDistance - rightDistance;
  });
}

export function createLocalJob(input: NewJobInput, id: string): Job {
  const contractor = input.contractor.trim();
  const title = input.title.trim();
  const location = input.location.trim();

  if (!contractor || !title || !location || input.salary <= 0 || input.duration <= 0) {
    throw new Error("A job requires a company, role, location, pay, and duration.");
  }

  return {
    id,
    contractor,
    reliability: 80,
    match: 88,
    title: { Hindi: title, English: title },
    location: { Hindi: location, English: location },
    salary: Math.round(input.salary),
    duration: Math.round(input.duration),
    skill: input.skill,
    initial: contractor.charAt(0).toUpperCase(),
    distanceKm: Number(location.match(/(\d+(?:\.\d+)?)\s*km/i)?.[1] ?? 9.9),
    coordinates: { latitude: 26.8467, longitude: 80.9462 },
    contractorTrust: { verified: false, paymentScore: 72, responseRate: 78, completedProjects: 0, memberSince: "New" },
  };
}

export function getChartMaximum(points: FinancePoint[]) {
  return Math.max(1, ...points.flatMap((point) => [point.income, point.expense]));
}
