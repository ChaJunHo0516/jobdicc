import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { documents, jobs as sampleJobs, personas as samplePersonas, seedApplications, seedInvites } from "../data/sample";
import type { Application, ApplicationStatus, DocStatus, Invite, Job, Persona, ReviewStatus, Role, TrainingDoc } from "../data/types";
import { isJobOpen } from "./logic";

type QuizRecord = { score: number; passed: boolean; at: string };

type State = {
  personaId: string | null;
  customPersonas: Persona[];
  personaOverrides: Record<string, Partial<Persona>>;
  docs: TrainingDoc[];
  jobs: Job[];
  applications: Application[];
  invites: Invite[];
  views: Record<string, string[]>;
  quiz: Record<string, Record<string, QuizRecord>>;
  audit: { at: string; actor: string; action: string }[];
};

const KEY = "prebridge-demo-v1";

function initial(): State {
  return {
    personaId: null,
    customPersonas: [],
    personaOverrides: {},
    docs: documents,
    jobs: sampleJobs,
    applications: seedApplications,
    invites: seedInvites,
    views: {},
    quiz: {},
    audit: [],
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial(), ...(JSON.parse(raw) as Partial<State>) };
  } catch {
    // 저장소를 사용할 수 없는 환경(사생활 보호 모드 등)에서는 초기 데이터로 동작한다.
  }
  return initial();
}

type Result = { ok: true; message: string } | { ok: false; message: string };

const today = () => new Date().toISOString().slice(0, 10);
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function useStoreValue() {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* 저장 실패는 무시(데모) */
    }
  }, [state]);

  const personas = useMemo(
    () => [...samplePersonas, ...state.customPersonas].map((p) => ({ ...p, ...state.personaOverrides[p.id] })),
    [state.customPersonas, state.personaOverrides],
  );
  const me = personas.find((p) => p.id === state.personaId) ?? null;

  const log = (s: State, action: string): State => ({
    ...s,
    audit: [{ at: new Date().toISOString(), actor: personas.find((p) => p.id === s.personaId)?.name ?? "-", action }, ...s.audit].slice(0, 100),
  });

  const update = useCallback((fn: (s: State) => State) => setState(fn), []);

  return {
    state,
    personas,
    me,
    login(personaId: string) {
      update((s) => ({ ...s, personaId }));
    },
    loginByEmail(email: string): Result {
      const p = personas.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!p) return { ok: false, message: "데모 계정 목록에 없는 이메일입니다. 아래 데모 계정을 선택하거나 회원가입하세요." };
      update((s) => ({ ...s, personaId: p.id }));
      return { ok: true, message: `${p.name}님으로 로그인했습니다.` };
    },
    logout() {
      update((s) => ({ ...s, personaId: null }));
    },
    signup(name: string, email: string): Result {
      const e = email.trim().toLowerCase();
      if (!name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { ok: false, message: "이름과 올바른 이메일을 입력하세요." };
      if (personas.some((p) => p.email === e)) return { ok: false, message: "이미 있는 데모 계정 이메일입니다." };
      const p: Persona = { id: uid("p"), name: name.trim(), email: e, role: "APPLICANT", companyId: null, departmentId: null, rank: null, custom: true };
      update((s) => ({ ...s, customPersonas: [...s.customPersonas, p], personaId: p.id }));
      return { ok: true, message: "가입되었습니다(이 브라우저에만 저장되는 데모 계정)." };
    },
    apply(jobId: string, coverLetter: string): Result {
      const job = state.jobs.find((j) => j.id === jobId);
      if (!me) return { ok: false, message: "로그인이 필요합니다." };
      if (!job || !isJobOpen(job)) return { ok: false, message: "마감된 공고에는 지원할 수 없습니다." };
      if (state.applications.some((a) => a.jobId === jobId && a.personaId === me.id && a.status !== "WITHDRAWN"))
        return { ok: false, message: "이미 지원한 공고입니다." };
      if (coverLetter.trim().length < 10) return { ok: false, message: "지원 동기를 10자 이상 입력하세요." };
      const app: Application = {
        id: uid("app"), jobId, companyId: job.companyId, personaId: me.id, applicantName: me.name, applicantEmail: me.email,
        coverLetter: coverLetter.trim(), status: "SUBMITTED", createdAt: today(),
      };
      update((s) => ({ ...s, applications: [app, ...s.applications] }));
      return { ok: true, message: "지원이 완료되었습니다." };
    },
    withdraw(appId: string) {
      update((s) => ({ ...s, applications: s.applications.map((a) => (a.id === appId ? { ...a, status: "WITHDRAWN" } : a)) }));
    },
    redeemInvite(code: string): Result {
      if (!me) return { ok: false, message: "로그인이 필요합니다." };
      const inv = state.invites.find((i) => i.code === code.trim().toUpperCase());
      if (!inv || inv.usedBy) return { ok: false, message: "유효하지 않거나 이미 사용된 초대 코드입니다." };
      if (inv.email !== me.email) return { ok: false, message: "초대받은 이메일 계정으로 로그인해야 등록할 수 있습니다." };
      update((s) =>
        log(
          {
            ...s,
            invites: s.invites.map((i) => (i.code === inv.code ? { ...i, usedBy: me.id } : i)),
            personaOverrides: {
              ...s.personaOverrides,
              [me.id]: { role: inv.role, companyId: inv.companyId, departmentId: inv.departmentId, rank: inv.rank },
            },
          },
          `초대 코드 등록 (${me.name})`,
        ),
      );
      return { ok: true, message: "합격자 인증이 완료되었습니다. 회사 학습공간에 입장할 수 있습니다." };
    },
    issueInvite(companyId: string, email: string, role: Role, departmentId: string | null): Result {
      const e = email.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { ok: false, message: "올바른 이메일을 입력하세요." };
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const part = () => Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
      const code = `${part()}-${part()}-${part()}`;
      update((s) => log({ ...s, invites: [{ code, companyId, email: e, role, departmentId, rank: 1, usedBy: null }, ...s.invites] }, `초대 코드 발급 → ${e}`));
      return { ok: true, message: code };
    },
    setMemberRole(personaId: string, role: Role) {
      update((s) => log({ ...s, personaOverrides: { ...s.personaOverrides, [personaId]: { ...s.personaOverrides[personaId], role } } }, `역할 변경 → ${role}`));
    },
    setDocStatus(docId: string, status: DocStatus) {
      update((s) => log({ ...s, docs: s.docs.map((d) => (d.id === docId ? { ...d, status } : d)) }, `문서 ${status === "APPROVED" ? "승인" : "반려"}`));
    },
    setAiStatus(docId: string, kind: "summary" | "quiz", status: ReviewStatus) {
      update((s) =>
        log(
          {
            ...s,
            docs: s.docs.map((d) =>
              d.id === docId && d.ai ? { ...d, ai: { ...d.ai, [kind === "summary" ? "summaryStatus" : "quizStatus"]: status } } : d,
            ),
          },
          `AI ${kind === "summary" ? "요약" : "퀴즈"} ${status === "APPROVED" ? "승인" : "반려"}`,
        ),
      );
    },
    uploadDoc(doc: Omit<TrainingDoc, "id" | "status" | "ai">) {
      update((s) => log({ ...s, docs: [{ ...doc, id: uid("doc"), status: "PENDING_APPROVAL", ai: null }, ...s.docs] }, `자료 업로드: ${doc.title}`));
    },
    /** 모의 AI 생성: 본문 문장을 그대로 요약·빈칸 퀴즈로 만든다(실제 AI 호출 아님) */
    mockGenerateAi(docId: string) {
      update((s) => ({
        ...s,
        docs: s.docs.map((d) => {
          if (d.id !== docId) return d;
          const sentences = d.body.filter((x) => x.length > 5);
          return {
            ...d,
            ai: {
              summary: sentences.slice(0, 2).join(" "),
              keyPoints: sentences.slice(0, 4),
              summaryStatus: "PENDING_REVIEW",
              quiz: sentences.slice(0, 2).map((sentence) => ({
                prompt: `다음 내용이 자료에 포함되어 있나요?\n"${sentence}"`,
                options: ["예, 포함되어 있다", "아니오", "자료에 없는 내용이다", "알 수 없다"],
                answerIndex: 0,
                explanation: "모의 생성 문항입니다. 실제 서비스에서는 AI가 문항을 만들고 담당자가 검토합니다.",
              })),
              quizStatus: "PENDING_REVIEW",
            },
          };
        }),
      }));
    },
    createJob(job: Omit<Job, "id">) {
      update((s) => log({ ...s, jobs: [{ ...job, id: uid("job") }, ...s.jobs] }, `채용공고 등록: ${job.title}`));
    },
    setJobStatus(jobId: string, status: Job["status"]) {
      update((s) => log({ ...s, jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, status } : j)) }, `공고 상태 → ${status}`));
    },
    setApplicationStatus(appId: string, status: ApplicationStatus) {
      update((s) => log({ ...s, applications: s.applications.map((a) => (a.id === appId ? { ...a, status } : a)) }, `지원 상태 → ${status}`));
    },
    recordView(docId: string) {
      if (!me) return;
      update((s) => {
        const v = s.views[me.id] ?? [];
        return v.includes(docId) ? s : { ...s, views: { ...s.views, [me.id]: [...v, docId] } };
      });
    },
    recordQuiz(docId: string, score: number, passed: boolean) {
      if (!me) return;
      update((s) => {
        const prev = s.quiz[me.id]?.[docId];
        const best = prev && prev.score >= score ? prev : { score, passed, at: new Date().toISOString() };
        return { ...s, quiz: { ...s.quiz, [me.id]: { ...s.quiz[me.id], [docId]: best } } };
      });
    },
    reset() {
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* 무시 */
      }
      setState(initial());
    },
  };
}

export type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
}
