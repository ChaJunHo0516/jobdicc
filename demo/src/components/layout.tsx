import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { ROLE_LABEL } from "../lib/logic";
import { companies } from "../data/sample";
import { cx } from "./ui";

export function DemoBanner() {
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900 sm:text-sm">
      <strong>데모 사이트</strong> · 가상 기업과 샘플 데이터로 만든 화면 시연용입니다. 로그인·권한·AI 기능은 <strong>모의 동작</strong>이며 실제 인증이나 보안이 적용되지 않습니다.
      입력한 내용은 이 브라우저에만 저장됩니다.
    </div>
  );
}

function PersonaSwitcher() {
  const { personas, me, login, logout } = useStore();
  const nav = useNavigate();
  return (
    <label className="flex items-center gap-2 text-xs text-slate-600">
      <span className="hidden sm:inline">데모 계정</span>
      <select
        aria-label="데모 계정 전환"
        className="max-w-[11rem] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
        value={me?.id ?? ""}
        onChange={(e) => {
          if (!e.target.value) {
            logout();
            nav("/");
            return;
          }
          login(e.target.value);
          const p = personas.find((x) => x.id === e.target.value);
          const c = companies.find((x) => x.id === p?.companyId);
          nav(c && p?.role !== "APPLICANT" ? `/c/${c.slug}` : "/me");
        }}
      >
        <option value="">로그아웃 상태</option>
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} · {ROLE_LABEL[p.role]}
            {p.companyId ? ` (${companies.find((c) => c.id === p.companyId)?.name})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

const navCls = ({ isActive }: { isActive: boolean }) => cx("rounded-md px-2 py-1 hover:text-indigo-700", isActive && "font-semibold text-indigo-700");

export function SiteLayout() {
  const { me, logout } = useStore();
  const [open, setOpen] = useState(false);
  const myCompany = companies.find((c) => c.id === me?.companyId);

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-lg font-bold text-indigo-700">
              PreBridge
            </Link>
            <button className="rounded-md border border-slate-300 px-2 py-1 text-xs md:hidden" onClick={() => setOpen(!open)} aria-expanded={open}>
              메뉴
            </button>
            <nav className={cx("w-full gap-1 text-sm text-slate-700 md:flex md:w-auto", open ? "flex flex-wrap" : "hidden")}>
              <NavLink to="/jobs" className={navCls}>채용공고</NavLink>
              {me && <NavLink to="/me" className={navCls}>내 대시보드</NavLink>}
              {me && myCompany && me.role !== "APPLICANT" && (
                <NavLink to={`/c/${myCompany.slug}`} className={navCls}>{myCompany.name} 학습공간</NavLink>
              )}
              <NavLink to="/roles" className={navCls}>권한별 화면</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <PersonaSwitcher />
            {me ? (
              <button className="rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-100" onClick={logout}>
                로그아웃
              </button>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-100">로그인</Link>
                <Link to="/signup" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        PreBridge 프론트엔드 데모 · 모든 기업·인물·자료는 가상입니다.
      </footer>
    </div>
  );
}
