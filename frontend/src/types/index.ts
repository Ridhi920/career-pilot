export interface Resume {
  id: number;
  file_name: string;
  file_path: string;
  resume_text: string;
  parsed_data?: ParsedResume;
  ats_analysis?: ATSScore;
  created_at: string;
}

export interface ATSCategoryScore {
  category: string;
  score: number;
  feedback: string;
}

export interface ATSImprovement {
  priority: string;
  section: string;
  suggestion: string;
}

export interface ATSScore {
  score: number;
  rating: string;
  summary: string;
  breakdown: ATSCategoryScore[];
  strengths: string[];
  issues: string[];
  improvements: ATSImprovement[];
  keyword_suggestions: string[];
}

export interface ResumeListItem {
  id: number;
  file_name: string;
  created_at: string;
  parsed_data?: ParsedResume;
  ats_analysis?: ATSScore;
}

export interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: string[];
}

export interface Experience {
  company: string;
  title: string;
  duration: string;
  description: string;
  technologies?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduation: string;
}

export interface Project {
  name: string;
  description: string;
  technologies?: string[];
  link?: string;
}

export interface ResumeVersion {
  id: number;
  resume_id: number;
  content: string;
  ats_score?: number;
  change_summary?: { changes: string[] };
  job_description?: string;
  created_at: string;
}

export interface ATSAnalysis {
  score: number;
  keyword_coverage: number;
  experience_match: string;
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  recommendations: string[];
  summary: string;
}

export interface SkillGapItem {
  skill: string;
  priority: string;
  reason: string;
  learning_time?: string;
}

export interface SkillGap {
  critical_missing: SkillGapItem[];
  medium_priority: SkillGapItem[];
  optional: SkillGapItem[];
  learning_roadmap: string[];
  estimated_preparation_time?: string;
}

export interface ResumeGenerated {
  optimized_resume: string;
  ats_score_before: number;
  ats_score_after: number;
  changes_made: string[];
  version_id: number;
}

export interface InterviewQuestions {
  technical: string[];
  behavioral: string[];
  scenario: string[];
  company_style: string[];
  job_role: string;
}

export interface InterviewFeedback {
  score: number;
  clarity_score: number;
  technical_accuracy_score: number;
  communication_score: number;
  star_format_used: boolean;
  strengths: string[];
  weaknesses: string[];
  improved_answer: string;
  tip: string;
}

export interface InterviewSession {
  id: number;
  question: string;
  answer?: string;
  feedback?: InterviewFeedback;
  score?: number;
  question_type?: string;
  job_role?: string;
  created_at: string;
}

export type ApplicationStatus = "Saved" | "Applied" | "Interview" | "Rejected" | "Offer";

export interface Application {
  id: number;
  company: string;
  job_title: string;
  job_description?: string;
  status: ApplicationStatus;
  ats_score?: number;
  notes?: string;
  job_url?: string;
  job_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface ApplicationMetrics {
  total: number;
  saved: number;
  applied: number;
  interviews: number;
  rejected: number;
  offers: number;
  success_rate: number;
}

export interface LearningResource {
  title: string;
  url?: string;
  type: string;
  platform?: string;
  duration?: string;
  free: boolean;
}

export interface SkillRoadmap {
  step: number;
  topic: string;
  description: string;
  duration: string;
}

export interface LearningPlan {
  skill: string;
  why_important: string;
  roadmap: SkillRoadmap[];
  resources: LearningResource[];
  projects: string[];
  total_duration: string;
}

export interface LearningPlanResponse {
  skills: LearningPlan[];
  overall_timeline: string;
  priority_order: string[];
}

export interface MarketSkill {
  skill: string;
  demand: number;
  category: string;
  trend: "rising" | "stable" | "declining";
  insight: string;
  in_resume: boolean;
}

export interface MarketSkillsResponse {
  analyzed_jobs: number;
  summary: string;
  top_skills: MarketSkill[];
  recommended_focus: string[];
}
