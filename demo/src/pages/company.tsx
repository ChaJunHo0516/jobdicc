import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useOutletContext, useParams } from "react-router-dom";
import { companies, departments, levels } from "../data/sample";
import type { Company, TrainingDoc } from "../data/types";
import { can, canSeeDoc, isMemberOf, ROLE_LABEL, scoreQuiz, visibleQuiz, visibleSummary, type Permission } from "../lib/logic";
import { useStore } from "../lib/store";
import { Badge, Button, Card, Empty, LinkButton, MockTag, Notice, PageHeader, Stat, cx } from "../components/ui";

export type CompanyCtx = { company: Company };
export const useCompany = () => useOutletContext<CompanyCtx>();

const NAV: { to: string; label: string; perm: Permission; section: string }[] = [
  { to: "", label: "홈", perm: "learning", section: "학습" },
  { to: "learn", label: "직무별 교육자료", perm: "learning", section: "학습" },
  { to: "progress", label: "내 학습 진도", perm: "learning", section: "학습" },
  { to: "admin", label: "관리 대시보드", perm: "document:manage", section: "관리" },
  { to: "admin/documents", label: "교육자료 승인", perm: "document:manage", section: "관리" },
  { to: "admin/ai", label: "AI 결과 검토", perm: "ai:review", section: "관리" },
  { to: "admin/members", label: "구성원·권한", perm: "member:manage", section: "관리" },
  { to: "admin/invites", label: "합격자 초대", perm: "invite:manage", section: "관리" },
  { to: "admin/jobs", label: "채용공고 관리", perm: "job:manage", section: "채용" },
  { to: "admin/applications", label: "지원자 관리", perm: "job:manage", section: "채용" },
];

/** 회사 공간 진입 검사. 소속이 아니면 '찾을 수 없음'을 보여 준다(실제 서비스는 서버가 404 응답). */
export function CompanyLayout() {
  const { slug } = useParams();
  const { me } = useStore();
  const company = companies.find((c) => c.slug === slug);

  if (!me) {
    return (
      <Card>
        <p className="text-sm">회사 학습공간은 로그인한 구성원만 이용할 수 있습니다.</p>
        <LinkButton to="/login" className="mt-3">로그인</LinkButton>
      </Card>
    );
  }
  if (!company || !isMemberOf(me, company.id)) {
    return (
      <div className="mx-auto max-w-lg space-y-3 py-10 text-center">
        <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-slate-600">소속 회사가 아니면 회사 공간의 존재 여부도 알려 주지 않습니다(회사 간 데이터 격리).</p>
        <Notice tone="yellow">데모 안내: 실제 서비스에서는 서버가 소속을 확인해 404로 응답합니다.</Notice>
        <LinkButton to="/me" variant="secondary">내 대시보드로</LinkButton>
      </div>
    );
  }

  const items = NAV.filter((n) => can(me, n.perm));
  const sections = [...new Set(items.map((i) => i.section))];
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <aside className="md:w-56 md:shrink-0">
        <p className="text-base font-semibold text-slate-900">{company.name}</p>
        <p className="mb-4 text-xs text-slate-500">{me.name} · {ROLE_LABEL[me.role]}</p>
        <nav className="flex gap-4 overflow-x-auto pb-2 text-sm md:block md:space-y-4 md:overflow-visible">
          {sections.map((s) => (
            <div key={s} className="shrink-0">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{s}</p>
              <ul className="flex gap-1 md:block md:space-y-0.5">
                {items.filter((i) => i.section === s).map((i) => (
                  <li key={i.to}>
                    <NavLink
                      end
                      to={`/c/${company.slug}${i.to ? `/${i.to}` : ""}`}
                      className={({ isActive }) => cx("block whitespace-nowrap rounded-md px-2 py-1.5 hover:bg-slate-100", isActive ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-700")}
                    >
                      {i.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet context={{ company } satisfies CompanyCtx} />
      </div>
    </div>
  );
}

function useVisibleDocs() {
  const { company } = useCompany();
  const { me, state } = useStore();
  return useMemo(() => state.docs.filter((d) => d.companyId === company.id && canSeeDoc(me, d)), [state.docs, me, company.id]);
}

function docProgress(docId: string, views: string[], quiz: Record<string, { score: number; passed: boolean }>, hasQuiz: boolean) {
  const q = quiz[docId];
  if (hasQuiz ? q?.passed : views.includes(docId)) return { label: "완료", tone: "green" as const };
  if (views.includes(docId) || q) return { label: "학습 중", tone: "yellow" as const };
  return { label: "미시작", tone: "gray" as const };
}

export function CompanyHome() {
  const { company } = useCompany();
  const { me, state } = useStore();
  const docs = useVisibleDocs();
  const views = state.views[me!.id] ?? [];
  const quiz = state.quiz[me!.id] ?? {};
  const done = docs.filter((d) => docProgress(d.id, views, quiz, visibleQuiz(d).length > 0).label === "완료").length;
  const dept = departments.find((d) => d.id === me!.departmentId)?.name;

  return (
    <div className="space-y-6">
      <PageHeader title={`${company.name} 학습공간`} description={`${me!.name}님 · ${ROLE_LABEL[me!.role]}${dept ? ` · ${dept}` : ""}`} />
      {me!.role === "PRE_HIRE" && <Notice tone="green">합격을 축하합니다! 입사 전까지 아래 자료로 프리온보딩을 진행하세요.</Notice>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="볼 수 있는 자료" value={docs.length} sub="부서·직급 규칙 적용" />
        <Stat label="완료한 자료" value={done} />
        <Stat label="진행률" value={`${docs.length ? Math.round((done / docs.length) * 100) : 0}%`} />
      </div>
      <Card title="다음에 볼 자료">
        {docs.length === 0 ? (
          <Empty>볼 수 있는 자료가 없습니다.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {docs.slice(0, 4).map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                <Link to={`/c/${company.slug}/learn/${d.id}`} className="font-medium text-slate-900 hover:text-indigo-700">{d.title}</Link>
                <Badge>{d.track}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function LearnPage() {
  const { company } = useCompany();
  const { me, state } = useStore();
  const docs = useVisibleDocs();
  const [track, setTrack] = useState("전체");
  const tracks = ["전체", ...new Set(docs.map((d) => d.track))];
  const shown = docs.filter((d) => track === "전체" || d.track === track);
  const views = state.views[me!.id] ?? [];
  const quiz = state.quiz[me!.id] ?? {};

  return (
    <div>
      <PageHeader title="직무별 교육자료" description="소속 부서·직급의 접근 규칙에 맞는 승인된 자료만 표시됩니다." />
      <div className="mb-4 flex flex-wrap gap-2">
        {tracks.map((t) => (
          <button key={t} onClick={() => setTrack(t)} className={`rounded-full border px-3 py-1 text-sm ${track === t ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-700"}`}>
            {t}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <Empty>이 직무에 볼 수 있는 자료가 없습니다.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((d) => {
            const pr = docProgress(d.id, views, quiz, visibleQuiz(d).length > 0);
            return (
              <Link key={d.id} to={`/c/${company.slug}/learn/${d.id}`} className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone="blue">{d.track}</Badge>
                  <Badge tone={pr.tone}>{pr.label}</Badge>
                </div>
                <h2 className="mt-2 font-semibold text-slate-900">{d.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{d.description}</p>
                {visibleQuiz(d).length > 0 && <p className="mt-2 text-xs text-indigo-700">퀴즈 {visibleQuiz(d).length}문항</p>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AccessRuleText({ doc }: { doc: TrainingDoc }) {
  const parts: string[] = [];
  parts.push(doc.access.departmentIds.length ? doc.access.departmentIds.map((id) => departments.find((d) => d.id === id)?.name).join(", ") : "전체 부서");
  if (doc.access.minRank != null) parts.push(`${levels.find((l) => l.companyId === doc.companyId && l.rank === doc.access.minRank)?.name ?? doc.access.minRank} 이상`);
  return <span>{parts.join(" · ")}</span>;
}

export function DocPage() {
  const { docId } = useParams();
  const { company } = useCompany();
  const { me, state, recordView } = useStore();
  const doc = state.docs.find((d) => d.id === docId);
  const visible = !!doc && doc.companyId === company.id && canSeeDoc(me, doc);

  useEffect(() => {
    if (visible && doc) recordView(doc.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, doc?.id]);

  if (!doc || !visible) return <Empty>자료를 찾을 수 없습니다. (접근 권한이 없는 자료는 존재 여부를 표시하지 않습니다.)</Empty>;
  const ai = visibleSummary(doc);
  const quiz = visibleQuiz(doc);

  return (
    <div className="space-y-6">
      <PageHeader
        title={doc.title}
        description={<>{doc.track} · 공개 범위: <AccessRuleText doc={doc} /></>}
        actions={quiz.length > 0 ? <LinkButton to={`/c/${company.slug}/quiz/${doc.id}`}>퀴즈 풀기 ({quiz.length}문항)</LinkButton> : undefined}
      />
      {ai && (
        <Card>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">AI 요약</h2>
            <Badge tone="green">AI 생성 · 교육담당자 검토 승인</Badge>
            <MockTag>샘플 요약</MockTag>
          </div>
          <p className="text-sm text-slate-700">{ai.summary}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {ai.keyPoints.map((k) => <li key={k}>{k}</li>)}
          </ul>
          <p className="mt-3 text-xs text-slate-500">AI 요약은 원문을 대신하지 않습니다. 정확한 내용은 아래 원문을 확인하세요.</p>
        </Card>
      )}
      <Card title="원문">
        <div className="space-y-2 text-sm leading-relaxed text-slate-800">
          {doc.body.map((p) => <p key={p}>{p}</p>)}
        </div>
      </Card>
    </div>
  );
}

export function QuizPage() {
  const { docId } = useParams();
  const { company } = useCompany();
  const { me, state, recordQuiz } = useStore();
  const doc = state.docs.find((d) => d.id === docId);
  const questions = doc && doc.companyId === company.id && canSeeDoc(me, doc) ? visibleQuiz(doc) : [];
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [result, setResult] = useState<ReturnType<typeof scoreQuiz> | null>(null);

  if (!doc || questions.length === 0) return <Empty>응시할 수 있는 퀴즈가 없습니다. (검토 승인 전 AI 퀴즈는 공개되지 않습니다.)</Empty>;

  return (
    <div className="space-y-6">
      <PageHeader title={`퀴즈: ${doc.title}`} description="70점 이상이면 이 자료를 완료로 기록합니다." />
      <Notice tone="yellow">AI 퀴즈 체험 화면입니다. 문항은 데모용 샘플이며, 채점은 브라우저에서 처리됩니다. 실제 서비스에서는 정답을 브라우저로 보내지 않고 서버가 채점합니다.</Notice>
      {questions.map((q, i) => (
        <Card key={i}>
          <p className="whitespace-pre-line font-medium text-slate-900">{i + 1}. {q.prompt}</p>
          <div className="mt-3 grid gap-2">
            {q.options.map((o, j) => {
              const chosen = answers[i] === j;
              const show = result !== null;
              return (
                <label
                  key={j}
                  className={cx(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                    show && j === q.answerIndex ? "border-emerald-400 bg-emerald-50" : show && chosen ? "border-rose-400 bg-rose-50" : chosen ? "border-indigo-400 bg-indigo-50" : "border-slate-200",
                  )}
                >
                  <input type="radio" name={`q${i}`} checked={chosen} disabled={show} onChange={() => setAnswers(answers.map((a, k) => (k === i ? j : a)))} />
                  {o}
                </label>
              );
            })}
          </div>
          {result && <p className="mt-2 text-xs text-slate-600">해설: {q.explanation}</p>}
        </Card>
      ))}
      {result ? (
        <Card>
          <p className="text-lg font-semibold">
            {result.score}점 ({result.correct}/{result.total}) · {result.passed ? <span className="text-emerald-700">통과</span> : <span className="text-rose-600">미통과</span>}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => { setAnswers(questions.map(() => null)); setResult(null); }}>다시 풀기</Button>
            <LinkButton to={`/c/${company.slug}/learn`} variant="ghost">자료 목록</LinkButton>
          </div>
        </Card>
      ) : (
        <Button
          disabled={answers.some((a) => a === null)}
          onClick={() => {
            const r = scoreQuiz(questions, answers);
            setResult(r);
            recordQuiz(doc.id, r.score, r.passed);
          }}
        >
          제출하고 채점하기
        </Button>
      )}
    </div>
  );
}

export function ProgressPage() {
  const { company } = useCompany();
  const { me, state } = useStore();
  const docs = useVisibleDocs();
  const views = state.views[me!.id] ?? [];
  const quiz = state.quiz[me!.id] ?? {};
  return (
    <div>
      <PageHeader title="내 학습 진도" />
      <Card>
        {docs.length === 0 ? (
          <Empty>볼 수 있는 자료가 없습니다.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {docs.map((d) => {
              const pr = docProgress(d.id, views, quiz, visibleQuiz(d).length > 0);
              return (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <Link to={`/c/${company.slug}/learn/${d.id}`} className="font-medium hover:text-indigo-700">{d.title}</Link>
                  <div className="flex items-center gap-2 text-sm">
                    {quiz[d.id] && <span className="text-slate-500">최고 {quiz[d.id].score}점</span>}
                    <Badge tone={pr.tone}>{pr.label}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
