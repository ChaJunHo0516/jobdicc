export type Role = "APPLICANT" | "PRE_HIRE" | "EMPLOYEE" | "TRAINER" | "COMPANY_ADMIN";

export type Track = "공통" | "개발" | "디자인" | "영업" | "물류운영" | "인사";

export type Company = {
  id: string;
  slug: string;
  name: string;
  industry: string;
  description: string;
};

export type Department = { id: string; companyId: string; name: string };

export type Level = { id: string; companyId: string; name: string; rank: number };

export type Persona = {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string | null;
  departmentId: string | null;
  rank: number | null;
  /** 직접 가입한 데모 계정 여부 */
  custom?: boolean;
};

export type DocStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type ReviewStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export type QuizQuestion = { prompt: string; options: string[]; answerIndex: number; explanation: string };

export type TrainingDoc = {
  id: string;
  companyId: string;
  title: string;
  track: Track;
  description: string;
  body: string[];
  status: DocStatus;
  uploadedBy: string;
  /** 접근 규칙: 부서 ID 목록(비어 있으면 전체 부서), 최소 직급 서열, 허용 역할(비어 있으면 전체) */
  access: { departmentIds: string[]; minRank: number | null; roles: Role[] };
  ai: {
    summary: string;
    keyPoints: string[];
    summaryStatus: ReviewStatus;
    quiz: QuizQuestion[];
    quizStatus: ReviewStatus;
  } | null;
};

export type JobStatus = "DRAFT" | "OPEN" | "CLOSED";

export type Job = {
  id: string;
  companyId: string;
  title: string;
  track: Track;
  location: string;
  employmentType: string;
  closeAt: string; // ISO date
  status: JobStatus;
  description: string;
  requirements: string[];
};

export type ApplicationStatus = "SUBMITTED" | "REVIEWING" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN";

export type Application = {
  id: string;
  jobId: string;
  companyId: string;
  personaId: string;
  applicantName: string;
  applicantEmail: string;
  coverLetter: string;
  status: ApplicationStatus;
  createdAt: string;
};

export type Invite = {
  code: string;
  companyId: string;
  email: string;
  role: Role;
  departmentId: string | null;
  rank: number | null;
  usedBy: string | null;
};
