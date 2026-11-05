import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { companies, departments } from "../data/sample";
import type { ApplicationStatus } from "../data/types";
import { isJobOpen, ROLE_LABEL } from "../lib/logic";
import { useStore } from "../lib/store";
import { Badge, Button, Card, Empty, Field, Input, LinkButton, MockTag, Notice, PageHeader, Textarea, type Tone } from "../components/ui";

export const APP_STATUS: Record<ApplicationStatus, [string, Tone]> = {
  SUBMITTED: ["지원 완료", "blue"],
  REVIEWING: ["서류 검토", "yellow"],
  INTERVIEW: ["면접", "yellow"],
  OFFERED: ["합격", "green"],
  REJECTED: ["불합격", "red"],
  WITHDRAWN: ["지원 철회", "gray"],
};

const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "-";

export function HomePage() {
  return (
    <div className="py-6">
      <p className="text-sm font-semibold text-indigo-700">채용부터 프리온보딩까지</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">입사 전부터 준비된 동료로</h1>
      <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
        PreBridge는 회사마다 독립된 학습공간에서 합격자와 직원이 직무교육을 받고, AI가 만든 요약과 퀴즈를 교육담당자가 검토한 뒤 공개하는 채용·온보딩 통합 플랫폼입니다.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton to="/login">데모 계정으로 둘러보기</LinkButton>
        <LinkButton to="/jobs" variant="secondary">채용공고 보기</LinkButton>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["회사별 독립 공간", "회사 자료는 그 회사 구성원에게만, 부서·직급 규칙에 맞게 공개됩니다."],
          ["직무별 교육자료", "개발·디자인·영업·물류 등 직무에 맞는 자료를 모아 봅니다."],
          ["검토된 AI 학습자료", "AI 요약·퀴즈는 교육담당자가 승인한 뒤에만 학습자에게 보입니다."],
          ["채용에서 온보딩까지", "지원 → 합격 → 초대 코드 인증 → 프리온보딩 학습으로 이어집니다."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">{t}</h2>
            <p className="mt-2 text-sm text-slate-600">{d}</p>
          </div>
        ))}
      </div>
      <Card className="mt-10" title="데모 이용 순서 예시">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>지원자 <strong>김지원</strong> 계정으로 로그인해 채용공고에 지원합니다.</li>
          <li>내 대시보드에서 데모 초대 코드 <code className="rounded bg-slate-100 px-1">ALPH-DEMO-2026</code>을 등록해 합격자로 인증합니다.</li>
          <li>알파테크 학습공간에서 직무별 자료를 보고 AI 퀴즈를 풀어 봅니다.</li>
          <li>상단의 데모 계정을 <strong>교육담당자·회사 관리자</strong>로 바꿔 승인·관리 화면을 확인합니다.</li>
        </ol>
      </Card>
    </div>
  );
}

export function LoginPage() {
  const { personas, login, loginByEmail } = useStore();
  const nav = useNavigate();
  const [msg, setMsg] = useState<string | null>(null);

  const go = (id: string) => {
    login(id);
    const p = personas.find((x) => x.id === id);
    const c = companies.find((x) => x.id === p?.companyId);
    nav(c && p?.role !== "APPLICANT" ? `/c/${c.slug}` : "/me");
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    const r = loginByEmail(email);
    if (!r.ok) return setMsg(r.message);
    const p = personas.find((x) => x.email === email.trim().toLowerCase());
    if (p) go(p.id);
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      <Card title="로그인">
        <Notice tone="yellow">데모에서는 비밀번호를 확인하지 않습니다. 실제 서비스에서는 서버가 비밀번호 해시 검증, 로그인 시도 제한, 세션 쿠키 발급을 수행합니다.</Notice>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="이메일">
            <Input name="email" type="email" required placeholder="jiwon.kim@example.com" autoComplete="off" />
          </Field>
          <Field label="비밀번호">
            <Input name="password" type="password" placeholder="데모에서는 아무 값이나 입력" autoComplete="off" />
          </Field>
          {msg && <p role="alert" className="text-sm text-rose-600">{msg}</p>}
          <Button type="submit" className="w-full">로그인 <MockTag /></Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          계정이 없나요? <Link to="/signup" className="text-indigo-700 hover:underline">회원가입</Link>
        </p>
      </Card>
      <Card title="데모 계정으로 바로 시작">
        <ul className="divide-y divide-slate-100">
          {personas.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{p.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {ROLE_LABEL[p.role]}
                  {p.companyId && ` · ${companyName(p.companyId)}`}
                  {p.departmentId && ` · ${departments.find((d) => d.id === p.departmentId)?.name}`}
                </p>
              </div>
              <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => go(p.id)}>선택</Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function SignupPage() {
  const { signup } = useStore();
  const nav = useNavigate();
  const [msg, setMsg] = useState<string | null>(null);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = signup(String(fd.get("name") ?? ""), String(fd.get("email") ?? ""));
    if (!r.ok) return setMsg(r.message);
    nav("/me");
  };
  return (
    <div className="mx-auto max-w-md">
      <Card title="개인 회원가입">
        <Notice tone="yellow">데모 가입 정보는 서버로 전송되지 않고 이 브라우저에만 저장됩니다. 실제 이메일이나 비밀번호를 입력하지 마세요.</Notice>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="이름"><Input name="name" required maxLength={30} /></Field>
          <Field label="이메일" hint="예: test@example.com (가상의 주소를 사용하세요)"><Input name="email" type="email" required /></Field>
          <Field label="비밀번호" hint="실제 서비스 정책: 10자 이상, 영문·숫자 포함"><Input name="password" type="password" minLength={10} autoComplete="off" /></Field>
          {msg && <p role="alert" className="text-sm text-rose-600">{msg}</p>}
          <Button type="submit" className="w-full">가입하기 <MockTag /></Button>
        </form>
      </Card>
    </div>
  );
}

export function JobsPage() {
  const { state } = useStore();
  const [track, setTrack] = useState("전체");
  const visible = state.jobs.filter((j) => j.status !== "DRAFT" && (track === "전체" || j.track === track));
  const tracks = ["전체", ...new Set(state.jobs.map((j) => j.track))];
  return (
    <div>
      <PageHeader title="채용공고" description="가상 기업의 샘플 채용공고입니다." />
      <div className="mb-4 flex flex-wrap gap-2">
        {tracks.map((t) => (
          <button key={t} onClick={() => setTrack(t)} className={`rounded-full border px-3 py-1 text-sm ${track === t ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-700"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((j) => {
          const open = isJobOpen(j);
          return (
            <Link key={j.id} to={`/jobs/${j.id}`} className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500">{companyName(j.companyId)} · {j.track}</p>
                  <h2 className="mt-1 font-semibold text-slate-900">{j.title}</h2>
                </div>
                <Badge tone={open ? "green" : "red"}>{open ? "모집 중" : "마감"}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{j.location} · {j.employmentType} · ~{j.closeAt}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function JobDetailPage() {
  const { id } = useParams();
  const { state, me, apply } = useStore();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const job = state.jobs.find((j) => j.id === id && j.status !== "DRAFT");
  if (!job) return <Empty>공고를 찾을 수 없습니다.</Empty>;
  const open = isJobOpen(job);
  const mine = me && state.applications.find((a) => a.jobId === job.id && a.personaId === me.id && a.status !== "WITHDRAWN");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <p className="text-sm text-slate-500">{companyName(job.companyId)} · {job.track}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{job.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone={open ? "green" : "red"}>{open ? "모집 중" : "마감"}</Badge>
          <Badge>{job.location}</Badge>
          <Badge>{job.employmentType}</Badge>
          <Badge>마감 {job.closeAt}</Badge>
        </div>
        <p className="mt-4 text-slate-700">{job.description}</p>
        <h2 className="mt-6 font-semibold">자격 요건</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {job.requirements.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </Card>
      <Card title="입사지원">
        {!open ? (
          <Notice tone="red">마감된 공고입니다. 실제 서비스에서는 서버가 마감 공고 지원을 거부합니다.</Notice>
        ) : !me ? (
          <div className="space-y-3 text-sm">
            <p>지원하려면 로그인하세요.</p>
            <LinkButton to="/login">로그인</LinkButton>
          </div>
        ) : mine ? (
          <Notice tone="green">이미 지원한 공고입니다. 현재 상태: <strong>{APP_STATUS[mine.status][0]}</strong></Notice>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setResult(apply(job.id, String(new FormData(e.currentTarget).get("cover") ?? "")));
            }}
          >
            <Field label="지원 동기" hint="10자 이상. 실제 개인정보는 입력하지 마세요.">
              <Textarea name="cover" rows={5} required maxLength={1000} />
            </Field>
            <Button type="submit" className="w-full">지원하기 <MockTag /></Button>
          </form>
        )}
        {result && <p role="status" className={`mt-3 text-sm ${result.ok ? "text-emerald-700" : "text-rose-600"}`}>{result.message}</p>}
      </Card>
    </div>
  );
}

export function MePage() {
  const { me, state, withdraw, redeemInvite } = useStore();
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  if (!me) {
    return (
      <Card>
        <p className="text-sm">로그인이 필요합니다.</p>
        <LinkButton to="/login" className="mt-3">로그인</LinkButton>
      </Card>
    );
  }
  const apps = state.applications.filter((a) => a.personaId === me.id);
  const company = companies.find((c) => c.id === me.companyId);

  return (
    <div className="space-y-6">
      <PageHeader title={`${me.name}님의 대시보드`} description={`${ROLE_LABEL[me.role]} · ${me.email}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="내 회사 학습공간">
          {company && me.role !== "APPLICANT" ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{company.name}</p>
                <p className="text-sm text-slate-500">{ROLE_LABEL[me.role]}</p>
              </div>
              <LinkButton to={`/c/${company.slug}`}>입장</LinkButton>
            </div>
          ) : (
            <Empty>소속된 회사가 없습니다. 합격 후 받은 초대 코드를 등록하세요.</Empty>
          )}
        </Card>
        <Card title="합격자 인증 (초대 코드 등록)">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setMsg(redeemInvite(String(new FormData(e.currentTarget).get("code") ?? "")));
            }}
          >
            <Field label="초대 코드" hint="데모 코드: ALPH-DEMO-2026 (김지원 계정 전용 · 이메일이 일치해야 등록됩니다)">
              <Input name="code" placeholder="XXXX-XXXX-XXXX" required autoComplete="off" />
            </Field>
            <Button type="submit">등록 <MockTag /></Button>
          </form>
          {msg && <p role="status" className={`mt-2 text-sm ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>{msg.message}</p>}
        </Card>
      </div>
      <Card title="내 지원현황">
        {apps.length === 0 ? (
          <Empty>지원 내역이 없습니다. <Link to="/jobs" className="text-indigo-700 hover:underline">채용공고 보기</Link></Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {apps.map((a) => {
              const job = state.jobs.find((j) => j.id === a.jobId);
              const [label, tone] = APP_STATUS[a.status];
              return (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{job?.title}</p>
                    <p className="text-xs text-slate-500">{companyName(a.companyId)} · 지원일 {a.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={tone}>{label}</Badge>
                    {(a.status === "SUBMITTED" || a.status === "REVIEWING") && (
                      <Button variant="ghost" className="px-2 py-1 text-xs text-rose-600" onClick={() => withdraw(a.id)}>지원 철회</Button>
                    )}
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

const MATRIX: [string, boolean[]][] = [
  ["공개 채용공고 조회·지원", [true, true, true, true, true]],
  ["초대 코드로 회사 합류", [true, false, false, false, false]],
  ["승인된 학습자료 열람(규칙 충족 시)", [false, true, true, true, true]],
  ["AI 퀴즈 응시·내 진도", [false, true, true, true, true]],
  ["교육자료 업로드·승인", [false, false, false, true, true]],
  ["AI 결과 검토·승인", [false, false, false, true, true]],
  ["구성원 학습 현황 조회", [false, false, false, true, true]],
  ["구성원·권한·초대 관리", [false, false, false, false, true]],
  ["채용공고·지원자 관리", [false, false, false, false, true]],
];

export function RolesPage() {
  const roles = ["APPLICANT", "PRE_HIRE", "EMPLOYEE", "TRAINER", "COMPANY_ADMIN"] as const;
  return (
    <div>
      <PageHeader title="권한별 화면 예시" description="역할에 따라 볼 수 있는 기능입니다. 상단의 '데모 계정'을 바꾸면 메뉴와 화면이 달라집니다." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2">기능</th>
                {roles.map((r) => <th key={r} className="px-3 py-2 text-center">{ROLE_LABEL[r]}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MATRIX.map(([label, row]) => (
                <tr key={label}>
                  <td className="px-3 py-2">{label}</td>
                  {row.map((ok, i) => (
                    <td key={i} className="px-3 py-2 text-center" aria-label={ok ? "가능" : "불가"}>
                      {ok ? <span className="text-emerald-600">●</span> : <span className="text-slate-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="mt-6">
        <Notice>
          회사 간 격리: 알파테크 구성원은 베타로지스 공간에 들어갈 수 없고, 그 반대도 마찬가지입니다. 플랫폼 관리자도 회사 내부 자료는 볼 수 없습니다.
          실제 서비스에서는 이 모든 검사를 서버가 수행합니다. 이 데모는 화면 흐름만 보여 줍니다.
        </Notice>
      </div>
    </div>
  );
}
