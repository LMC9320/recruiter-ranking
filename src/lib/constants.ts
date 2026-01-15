export const SECTORS = [
  "Executive Search",
  "Finance",
  "Technology",
  "Legal",
  "Human Resources",
  "Private Equity",
  "Venture Capital",
  "Investment Banking",
  "Financial Services",
  "Strategy Consulting",
  "Corporate Development",
  "Marketing",
  "Engineering",
  "Healthcare",
  "Life Sciences",
  "Energy",
  "Real Estate",
  "Retail",
  "Manufacturing",
  "Professional Services",
] as const;

export const LOCATIONS = [
  "London",
  "Manchester",
  "Birmingham",
  "Leeds",
  "Bristol",
  "Edinburgh",
  "Glasgow",
  "Liverpool",
  "Newcastle",
  "Sheffield",
  "Cambridge",
  "Oxford",
  "Cardiff",
  "Belfast",
  "Remote",
] as const;

export const COMPANY_SIZES = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
] as const;

export const REVIEWER_TYPES = [
  { value: "candidate", label: "Candidate" },
  { value: "hiring_manager", label: "Hiring Manager" },
] as const;

export const RATING_CATEGORIES = [
  {
    key: "communication",
    label: "Communication",
    description: "How well did they communicate throughout the process?",
  },
  {
    key: "candidateCare",
    label: "Candidate Care",
    description: "How well were you treated as a candidate?",
  },
  {
    key: "jobQuality",
    label: "Job Quality",
    description: "Quality and relevance of the job opportunities presented",
  },
  {
    key: "speed",
    label: "Process Speed",
    description: "How efficiently did the recruitment process move?",
  },
] as const;

export const SORT_OPTIONS = [
  { value: "rating", label: "Highest Rated" },
  { value: "reviews", label: "Most Reviews" },
  { value: "recent", label: "Recently Reviewed" },
  { value: "name", label: "Alphabetical" },
] as const;
