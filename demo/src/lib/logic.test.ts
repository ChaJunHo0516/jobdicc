import { describe, expect, it } from "vitest";
import { canSeeDoc, can, isJobOpen, isMemberOf, scoreQuiz, visibleQuiz, visibleSummary } from "./logic";
import { documents, jobs, personas } from "../data/sample";

const P = (id: string) => personas.find((p) => p.id === id)!;
const D = (id: string) => documents.find((d) => d.id === id)!;

describe("회사 간 격리(데모 로직)", () => {
  it("다른 회사 구성원은 회사 공간과 문서에 접근할 수 없다", () => {
    expect(isMemberOf(P("p-beta-emp"), "alpha")).toBe(false);
    expect(canSeeDoc(P("p-beta-admin"), D("doc-a-welcome"))).toBe(false);
    expect(canSeeDoc(P("p-admin"), D("doc-b-safety"))).toBe(false);
  });

  it("지원자는 어떤 회사 자료도 볼 수 없다", () => {
    expect(documents.some((d) => canSeeDoc(P("p-applicant"), d))).toBe(false);
  });
});

describe("부서·직급별 접근 규칙", () => {
  it("개발팀 문서는 개발팀만, 디자인팀 직원은 볼 수 없다", () => {
    expect(canSeeDoc(P("p-employee"), D("doc-a-dev-workflow"))).toBe(true);
    expect(canSeeDoc(P("p-designer"), D("doc-a-dev-workflow"))).toBe(false);
  });

  it("최소 직급 규칙: 대리 이상 문서는 사원(합격자)에게 보이지 않는다", () => {
    expect(canSeeDoc(P("p-prehire"), D("doc-a-dev-arch"))).toBe(false);
    expect(canSeeDoc(P("p-employee"), D("doc-a-dev-arch"))).toBe(true);
  });

  it("승인 대기 문서는 학습자에게 보이지 않는다", () => {
    expect(canSeeDoc(P("p-employee"), D("doc-a-pending"))).toBe(false);
  });

  it("교육담당자는 회사의 승인 문서를 모두 본다", () => {
    expect(canSeeDoc(P("p-trainer"), D("doc-a-hr-eval"))).toBe(true);
  });
});

describe("AI 결과 공개", () => {
  it("검토 대기 중인 AI 퀴즈·요약은 노출하지 않는다", () => {
    expect(visibleQuiz(D("doc-a-design"))).toEqual([]);
    expect(visibleSummary(D("doc-a-pending"))).toBeNull();
    expect(visibleQuiz(D("doc-a-welcome")).length).toBeGreaterThan(0);
  });
});

describe("권한", () => {
  it("직원은 관리 기능이 없고, 교육담당자는 채용 관리 권한이 없다", () => {
    expect(can(P("p-employee"), "document:manage")).toBe(false);
    expect(can(P("p-trainer"), "job:manage")).toBe(false);
    expect(can(P("p-admin"), "job:manage")).toBe(true);
  });
});

describe("퀴즈 채점·공고 마감", () => {
  it("정답 비율로 점수를 계산하고 70점 이상이면 통과", () => {
    const q = visibleQuiz(D("doc-a-welcome"));
    expect(scoreQuiz(q, q.map((x) => x.answerIndex))).toMatchObject({ score: 100, passed: true });
    expect(scoreQuiz(q, [null, null, null])).toMatchObject({ score: 0, passed: false });
  });

  it("마감일이 지난 공고와 수동 마감 공고는 지원 불가", () => {
    const fe = jobs.find((j) => j.id === "job-a-fe")!;
    expect(isJobOpen(fe, new Date("2026-11-05"))).toBe(true);
    expect(isJobOpen(fe, new Date("2027-02-02"))).toBe(false);
    expect(isJobOpen(jobs.find((j) => j.id === "job-a-sales")!)).toBe(false);
  });
});
