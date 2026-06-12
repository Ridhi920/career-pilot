import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 120000, // 2 min for AI calls
});

// Resume
export const resumeApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/api/resume/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  list: () => api.get("/api/resume"),
  get: (id: number) => api.get(`/api/resume/${id}`),
  delete: (id: number) => api.delete(`/api/resume/${id}`),
  versions: (id: number) => api.get(`/api/resume/${id}/versions`),
};

// Analysis
export const analysisApi = {
  atsScore: (resume_id: number, refresh = false) =>
    api.get(`/api/analysis/ats-score/${resume_id}`, {
      params: refresh ? { refresh: true } : {},
    }),
  ats: (resume_id: number, job_description: string) =>
    api.post("/api/analysis/ats", { resume_id, job_description }),
  skillGap: (resume_id: number, job_description: string) =>
    api.post("/api/analysis/skills", { resume_id, job_description }),
  generate: (resume_id: number, job_description: string) =>
    api.post("/api/analysis/generate", { resume_id, job_description }),
};

// Interview
export const interviewApi = {
  generateQuestions: (data: {
    job_description: string;
    job_role: string;
    num_questions?: number;
    resume_id?: number;
  }) => api.post("/api/interview/questions", data),
  evaluate: (data: {
    question: string;
    answer: string;
    question_type?: string;
    job_role?: string;
  }) => api.post("/api/interview/evaluate", data),
  sessions: () => api.get("/api/interview/sessions"),
};

// Applications
export const applicationsApi = {
  create: (data: object) => api.post("/api/applications", data),
  list: (status?: string) =>
    api.get("/api/applications", { params: status ? { status } : {} }),
  get: (id: number) => api.get(`/api/applications/${id}`),
  update: (id: number, data: object) => api.patch(`/api/applications/${id}`, data),
  delete: (id: number) => api.delete(`/api/applications/${id}`),
  metrics: () => api.get("/api/applications/metrics"),
};

// Learning
export const learningApi = {
  recommend: (data: {
    skills: string[];
    current_level?: string;
    target_role?: string;
  }) => api.post("/api/learning/recommend", data),
  marketSkills: (data: { resume_id?: number } = {}) =>
    api.post("/api/learning/market-skills", data),
};
