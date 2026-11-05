import Link from "next/link";
import { getCurrentUser } from "@/server/auth/current";
import { logoutAction } from "@/actions/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-indigo-700">
            PreBridge
          </Link>
          <nav className="flex gap-4 text-sm text-slate-700">
            <Link href="/jobs" className="hover:text-indigo-700">
              채용공고
            </Link>
            {user && (
              <>
                <Link href="/me" className="hover:text-indigo-700">
                  내 대시보드
                </Link>
                <Link href="/me/applications" className="hover:text-indigo-700">
                  내 지원현황
                </Link>
              </>
            )}
            {user?.platformRole === "SUPER_ADMIN" && (
              <Link href="/platform/companies" className="hover:text-indigo-700">
                플랫폼 관리
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-slate-600" data-testid="current-user">
                {user.name}
              </span>
              <form action={logoutAction}>
                <button className="rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-100">로그아웃</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-100">
                로그인
              </Link>
              <Link href="/signup" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
