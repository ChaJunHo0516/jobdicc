import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { departments, levels } from "../data/sample";
import type { ApplicationStatus, DocStatus, ReviewStatus, Role, Track } from "../data/types";
import { can, canSeeDoc, isJobOpen, ROLE_LABEL, visibleQuiz, type Permission } from "../lib/logic";
import { useStore } from "../lib/store";
import { Badge, Button, Card, Empty, Field, Input, MockTag, Notice, PageHeader, Select, Stat, Textarea, type Tone } from "../components/ui";
import { useCompany } from "./company";
import { APP_STATUS } from "./public";

/** 권한이 없으면 관리 화면 대신 안내를 보여 준다(실제 서비스는 서버가 404 응답) */
function Guard({ perm, children }: { perm: Permission; children: ReactNode }) {
  const { me } = useStore();
  if (!can(me, perm)) return <Empty>이 화면을 볼 권한이 없습니다. (실제 서비스에서는 서버가 요청을 차단합니다.)</Empty>;
  return <>{children}</>;
}

const DOC_STATUS: Record<DocStatus, [string, Tone]> = {
  PENDING_APPROVAL: ["승인 대기", "yellow"],
  APPROVED: ["승인됨", "green"],
  REJECTED: ["반려", "red"],
};
const AI_STATUS: Record<ReviewStatus, [string, Tone]> = {
  PENDING_REVIEW: ["AI 생성 · 검토 대기", "yellow"],
  APPROVED: ["AI 생성 · 승인", "green"],
  REJECTED: ["AI 생성 · 반려", "red"],
};

export function AdminDashboard() {
  const { company } = useCompany();
  const { state, personas } = useStore();
  const docs = state.docs.filter((d) => d.companyId === company.id);
  const members = personas.filter((p) => p.companyId === company.id && p.role !== "APPLICANT");
  const learners = members.filter((p) => p.role === "EMPLOYEE" || p.role === "PRE_HIRE");
  const pendingAi = docs.filter((d) => d.ai && (d.ai.summaryStatus === "PENDING_REVIEW" || (d.ai.quiz.length > 0 && d.ai.quizStatus === "PENDING_REVIEW"))).length;
  const apps = state.applications.filter((a) => a.companyId === company.id);

  return (
    <Guard perm="document:manage">
      <PageHeader title="관리 대시보드" description={`${company.name}의 교육·채용 현황`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="구성원" value={members.length} sub={`합격자 ${members.filter((m) => m.role === "PRE_HIRE").length}명 포함`} />
        <Stat label="승인 대기 자료" value={docs.filter((d) => d.status === "PENDING_APPROVAL").length} />
        <Stat label="검토 대기 AI 결과" value={pendingAi} />
        <Stat label="진행 중 지원서" value={apps.filter((a) => !["REJECTED", "WITHDRAWN", "OFFERED"].includes(a.status)).length} />
      </div>
      <Card className="mt-6" title="구성원 학습 현황">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b text-xs text-slate-500">
              <tr><th className="px-3 py-2">이름</th><th className="px-3 py-2">역할</th><th className="px-3 py-2">열람 가능</th><th className="px-3 py-2">열람</th><th className="px-3 py-2">퀴즈 통과</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {learners.map((p) => {
                const visible = docs.filter((d) => canSeeDoc(p, d));
                const views = (state.views[p.id] ?? []).filter((id) => visible.some((d) => d.id === id)).length;
                const passed = Object.entries(state.quiz[p.id] ?? {}).filter(([id, r]) => r.passed && visible.some((d) => d.id === id)).length;
                return (
                  <tr key={p.id}>
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2">{ROLE_LABEL[p.role]}</td>
                    <td className="px-3 py-2">{visible.length}</td>
                    <td className="px-3 py-2">{views}</td>
                    <td className="px-3 py-2">{passed}/{visible.filter((d) => visibleQuiz(d).length > 0).length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">진도는 이 브라우저에서 각 데모 계정으로 학습한 기록입니다.</p>
      </Card>
      <Card className="mt-6" title="최근 작업 기록 (감사 로그 예시)">
        {state.audit.length === 0 ? <Empty>아직 기록이 없습니다.</Empty> : (
          <ul className="space-y-1 text-sm">
            {state.audit.slice(0, 10).map((a, i) => (
              <li key={i} className="flex justify-between gap-2"><span>{a.actor} · {a.action}</span><span className="text-xs text-slate-500">{new Date(a.at).toLocaleString("ko-KR")}</span></li>
            ))}
          </ul>
        )}
      </Card>
    </Guard>
  );
}

const TRACKS: Track[] = ["공통", "개발", "디자인", "영업", "물류운영", "인사"];

export function AdminDocuments() {
  const { company } = useCompany();
  const { me, state, setDocStatus, uploadDoc, mockGenerateAi } = useStore();
  const docs = state.docs.filter((d) => d.companyId === company.id);
  const depts = departments.filter((d) => d.companyId === company.id);
  const lvls = levels.filter((l) => l.companyId === company.id);
  const [msg, setMsg] = useState<string | null>(null);

  const upload = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const body = String(fd.get("body") ?? "").split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (title.length < 2 || body.length === 0) return setMsg("제목과 본문을 입력하세요.");
    const dept = String(fd.get("dept") ?? "");
    const minRank = String(fd.get("minRank") ?? "");
    uploadDoc({
      companyId: company.id,
      title,
      track: fd.get("track") as Track,
      description: String(fd.get("description") ?? ""),
      body,
      uploadedBy: me!.name,
      access: { departmentIds: dept ? [dept] : [], minRank: minRank ? Number(minRank) : null, roles: [] },
    });
    e.currentTarget.reset();
    setMsg("업로드했습니다. 승인 전까지 학습자에게 보이지 않습니다.");
  };

  return (
    <Guard perm="document:manage">
      <PageHeader title="교육자료 승인" description="업로드된 자료는 승인 전까지 학습자에게 공개되지 않습니다." />
      <Card title="자료 등록">
        <Notice tone="yellow">데모에서는 파일 대신 본문 텍스트를 입력합니다. 실제 서비스는 PDF/TXT/MD 파일을 서버에서 검증한 뒤 회사별 격리 저장소에 보관합니다. 기밀자료를 입력하지 마세요.</Notice>
        <form onSubmit={upload} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="제목"><Input name="title" required maxLength={80} /></Field>
          <Field label="직무"><Select name="track">{TRACKS.map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="공개 부서"><Select name="dept"><option value="">전체 부서</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
          <Field label="최소 직급"><Select name="minRank"><option value="">제한 없음</option>{lvls.map((l) => <option key={l.id} value={l.rank}>{l.name} 이상</option>)}</Select></Field>
          <div className="sm:col-span-2"><Field label="설명"><Input name="description" maxLength={120} /></Field></div>
          <div className="sm:col-span-2"><Field label="본문" hint="한 줄에 한 문장씩 입력"><Textarea name="body" rows={4} required /></Field></div>
          <div className="sm:col-span-2 flex items-center gap-3"><Button type="submit">업로드 <MockTag /></Button>{msg && <span role="status" className="text-sm text-emerald-700">{msg}</span>}</div>
        </form>
      </Card>
      <Card className="mt-6" title="자료 목록">
        <ul className="divide-y divide-slate-100">
          {docs.map((d) => {
            const [label, tone] = DOC_STATUS[d.status];
            const selfUpload = d.uploadedBy === me!.name && me!.role === "TRAINER";
            return (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs text-slate-500">{d.track} · 업로드 {d.uploadedBy}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={tone}>{label}</Badge>
                  {d.status === "PENDING_APPROVAL" && (
                    selfUpload ? (
                      <span className="text-xs text-slate-500">본인 업로드 자료는 다른 담당자가 승인</span>
                    ) : (
                      <>
                        <Button className="px-3 py-1 text-xs" onClick={() => setDocStatus(d.id, "APPROVED")}>승인</Button>
                        <Button variant="danger" className="px-3 py-1 text-xs" onClick={() => setDocStatus(d.id, "REJECTED")}>반려</Button>
                      </>
                    )
                  )}
                  {!d.ai && d.status !== "REJECTED" && (
                    <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => mockGenerateAi(d.id)}>AI 요약·퀴즈 생성 <MockTag /></Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </Guard>
  );
}

export function AdminAiReview() {
  const { company } = useCompany();
  const { state, setAiStatus } = useStore();
  const docs = state.docs.filter((d) => d.companyId === company.id && d.ai);
  return (
    <Guard perm="ai:review">
      <PageHeader title="AI 결과 검토" description="AI가 만든 요약과 퀴즈는 담당자가 승인해야 학습자에게 공개됩니다." />
      <Notice tone="yellow">이 데모의 'AI 결과'는 미리 작성한 샘플이거나 본문 문장을 그대로 사용한 모의 생성 결과입니다. 실제 AI가 만든 결과가 아닙니다.</Notice>
      <div className="mt-6 space-y-4">
        {docs.length === 0 && <Empty>검토할 AI 결과가 없습니다.</Empty>}
        {docs.map((d) => (
          <Card key={d.id} title={d.title}>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-2"><h3 className="font-medium">요약</h3><Badge tone={AI_STATUS[d.ai!.summaryStatus][1]}>{AI_STATUS[d.ai!.summaryStatus][0]}</Badge></div>
                <p className="text-sm text-slate-700">{d.ai!.summary}</p>
                {d.ai!.summaryStatus === "PENDING_REVIEW" && (
                  <div className="mt-2 flex gap-2">
                    <Button className="px-3 py-1 text-xs" onClick={() => setAiStatus(d.id, "summary", "APPROVED")}>승인</Button>
                    <Button variant="danger" className="px-3 py-1 text-xs" onClick={() => setAiStatus(d.id, "summary", "REJECTED")}>반려</Button>
                  </div>
                )}
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2"><h3 className="font-medium">퀴즈 {d.ai!.quiz.length}문항</h3>{d.ai!.quiz.length > 0 && <Badge tone={AI_STATUS[d.ai!.quizStatus][1]}>{AI_STATUS[d.ai!.quizStatus][0]}</Badge>}</div>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
                  {d.ai!.quiz.map((q, i) => <li key={i} className="whitespace-pre-line">{q.prompt} <span className="text-emerald-700">(정답: {q.options[q.answerIndex]})</span></li>)}
                </ol>
                {d.ai!.quiz.length > 0 && d.ai!.quizStatus === "PENDING_REVIEW" && (
                  <div className="mt-2 flex gap-2">
                    <Button className="px-3 py-1 text-xs" onClick={() => setAiStatus(d.id, "quiz", "APPROVED")}>승인 후 공개</Button>
                    <Button variant="danger" className="px-3 py-1 text-xs" onClick={() => setAiStatus(d.id, "quiz", "REJECTED")}>반려</Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Guard>
  );
}

const ROLES: Role[] = ["PRE_HIRE", "EMPLOYEE", "TRAINER", "COMPANY_ADMIN"];

export function AdminMembers() {
  const { company } = useCompany();
  const { me, personas, setMemberRole } = useStore();
  const members = personas.filter((p) => p.companyId === company.id && p.role !== "APPLICANT");
  const adminCount = members.filter((m) => m.role === "COMPANY_ADMIN").length;
  return (
    <Guard perm="member:manage">
      <PageHeader title="구성원·권한" description="합격자가 입사하면 역할을 '직원'으로 바꿉니다." />
      <Card>
        <ul className="divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{m.name} {m.id === me!.id && <Badge tone="blue">나</Badge>}</p>
                <p className="text-xs text-slate-500">{m.email} · {departments.find((d) => d.id === m.departmentId)?.name ?? "부서 없음"}</p>
              </div>
              <Select
                aria-label={`${m.name} 역할`}
                className="w-auto"
                value={m.role}
                onChange={(e) => {
                  if (m.role === "COMPANY_ADMIN" && adminCount <= 1) return alert("마지막 회사 관리자는 강등할 수 없습니다.");
                  setMemberRole(m.id, e.target.value as Role);
                }}
              >
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </Select>
            </li>
          ))}
        </ul>
      </Card>
    </Guard>
  );
}

export function AdminInvites() {
  const { company } = useCompany();
  const { state, issueInvite } = useStore();
  const [issued, setIssued] = useState<{ ok: boolean; message: string } | null>(null);
  const invites = state.invites.filter((i) => i.companyId === company.id);
  return (
    <Guard perm="invite:manage">
      <PageHeader title="합격자 초대" description="초대 코드는 지정한 이메일 계정에서만 등록할 수 있습니다." />
      <Card title="초대 코드 발급">
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setIssued(issueInvite(company.id, String(fd.get("email")), fd.get("role") as Role, String(fd.get("dept")) || null));
          }}
        >
          <Field label="이메일"><Input name="email" type="email" required placeholder="name@example.com" /></Field>
          <Field label="역할"><Select name="role">{(["PRE_HIRE", "EMPLOYEE", "TRAINER"] as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select></Field>
          <Field label="부서"><Select name="dept"><option value="">지정 안 함</option>{departments.filter((d) => d.companyId === company.id).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
          <div><Button type="submit">발급 <MockTag /></Button></div>
        </form>
        {issued && (issued.ok ? (
          <div className="mt-3"><Notice tone="green">발급된 코드: <code className="font-bold">{issued.message}</code> — 실제 서비스에서는 이 코드를 한 번만 보여 주고 서버에는 해시만 저장합니다.</Notice></div>
        ) : <p className="mt-2 text-sm text-rose-600">{issued.message}</p>)}
      </Card>
      <Card className="mt-6" title="발급 내역">
        <ul className="divide-y divide-slate-100 text-sm">
          {invites.map((i) => (
            <li key={i.code} className="flex flex-wrap justify-between gap-2 py-2">
              <span>{i.email} · {ROLE_LABEL[i.role]}</span>
              <Badge tone={i.usedBy ? "green" : "yellow"}>{i.usedBy ? "등록 완료" : "대기"}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </Guard>
  );
}

export function AdminJobs() {
  const { company } = useCompany();
  const { state, createJob, setJobStatus } = useStore();
  const jobs = state.jobs.filter((j) => j.companyId === company.id);
  return (
    <Guard perm="job:manage">
      <PageHeader title="채용공고 관리" description="공고를 등록·게시·마감합니다. 마감일이 지나면 자동으로 지원이 막힙니다." />
      <Card title="공고 등록">
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            createJob({
              companyId: company.id,
              title: String(fd.get("title")),
              track: fd.get("track") as Track,
              location: String(fd.get("location")),
              employmentType: "정규직",
              closeAt: String(fd.get("closeAt")),
              status: fd.get("publish") ? "OPEN" : "DRAFT",
              description: String(fd.get("description")),
              requirements: String(fd.get("requirements")).split(/\n+/).filter(Boolean),
            });
            e.currentTarget.reset();
          }}
        >
          <Field label="제목"><Input name="title" required maxLength={60} /></Field>
          <Field label="직무"><Select name="track">{TRACKS.map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="근무지"><Input name="location" required maxLength={40} /></Field>
          <Field label="마감일"><Input name="closeAt" type="date" required /></Field>
          <div className="sm:col-span-2"><Field label="소개"><Textarea name="description" rows={2} required /></Field></div>
          <div className="sm:col-span-2"><Field label="자격 요건" hint="한 줄에 하나씩"><Textarea name="requirements" rows={2} /></Field></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publish" defaultChecked /> 바로 게시</label>
          <div><Button type="submit">등록 <MockTag /></Button></div>
        </form>
      </Card>
      <Card className="mt-6" title="공고 목록">
        <ul className="divide-y divide-slate-100">
          {jobs.map((j) => {
            const open = isJobOpen(j);
            return (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{j.title}</p>
                  <p className="text-xs text-slate-500">{j.track} · 마감 {j.closeAt} · 지원 {state.applications.filter((a) => a.jobId === j.id).length}건</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={j.status === "DRAFT" ? "gray" : open ? "green" : "red"}>{j.status === "DRAFT" ? "작성 중" : open ? "모집 중" : "마감"}</Badge>
                  {j.status === "DRAFT" && <Button className="px-3 py-1 text-xs" onClick={() => setJobStatus(j.id, "OPEN")}>게시</Button>}
                  {j.status === "OPEN" && <Button variant="danger" className="px-3 py-1 text-xs" onClick={() => setJobStatus(j.id, "CLOSED")}>마감</Button>}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </Guard>
  );
}

const NEXT: ApplicationStatus[] = ["SUBMITTED", "REVIEWING", "INTERVIEW", "OFFERED", "REJECTED"];

export function AdminApplications() {
  const { company } = useCompany();
  const { state, setApplicationStatus } = useStore();
  const apps = state.applications.filter((a) => a.companyId === company.id);
  return (
    <Guard perm="job:manage">
      <PageHeader title="지원자 관리" description="이 회사 공고에 들어온 지원서만 보입니다." />
      <Card>
        {apps.length === 0 ? <Empty>지원서가 없습니다.</Empty> : (
          <ul className="divide-y divide-slate-100">
            {apps.map((a) => (
              <li key={a.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{a.applicantName} <span className="text-xs text-slate-500">{a.applicantEmail}</span></p>
                    <p className="text-xs text-slate-500">{state.jobs.find((j) => j.id === a.jobId)?.title} · {a.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={APP_STATUS[a.status][1]}>{APP_STATUS[a.status][0]}</Badge>
                    {a.status !== "WITHDRAWN" && (
                      <Select aria-label="지원 상태 변경" className="w-auto" value={a.status} onChange={(e) => setApplicationStatus(a.id, e.target.value as ApplicationStatus)}>
                        {NEXT.map((s) => <option key={s} value={s}>{APP_STATUS[s][0]}</option>)}
                      </Select>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-700">{a.coverLetter}</p>
                {a.status === "OFFERED" && (
                  <p className="mt-1 text-xs"><Link to={`/c/${company.slug}/admin/invites`} className="text-indigo-700 hover:underline">합격자 초대 코드 발급하기 →</Link></p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Guard>
  );
}
