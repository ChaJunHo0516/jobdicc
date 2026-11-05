import Link from "next/link";
import { can, type Action } from "@/server/authz/policy";
import type { TenantContext } from "@/server/authz/context";
import { MEMBER_ROLE } from "@/lib/labels";

type Item = { href: string; label: string; action: Action };

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: "학습",
    items: [
      { href: "", label: "홈", action: "learning:access" },
      { href: "/learn", label: "학습자료", action: "learning:access" },
      { href: "/learn/progress", label: "내 학습 진도", action: "learning:access" },
    ],
  },
  {
    title: "교육 관리",
    items: [
      { href: "/admin/documents", label: "교육자료 관리", action: "document:viewAll" },
      { href: "/admin/ai-review", label: "AI 결과 검토", action: "ai:review" },
      { href: "/admin/progress", label: "구성원 학습 현황", action: "progress:viewAll" },
    ],
  },
  {
    title: "채용",
    items: [
      { href: "/admin/jobs", label: "채용공고 관리", action: "job:manage" },
      { href: "/admin/applications", label: "지원자 관리", action: "application:manage" },
    ],
  },
  {
    title: "회사 관리",
    items: [
      { href: "/admin/members", label: "구성원·권한", action: "member:manage" },
      { href: "/admin/invites", label: "합격자 초대", action: "invite:manage" },
      { href: "/admin/org", label: "부서·직급", action: "org:manage" },
      { href: "/admin/audit", label: "감사 로그", action: "audit:view" },
    ],
  },
];

/** 역할별 메뉴. 메뉴 숨김은 편의 기능일 뿐이며 실제 권한 검사는 각 페이지와 서버 액션에서 수행한다. */
export function CompanyNav({ ctx }: { ctx: TenantContext }) {
  const base = `/c/${ctx.companySlug}`;
  return (
    <nav className="space-y-5 text-sm">
      <div>
        <p className="text-base font-semibold text-slate-900">{ctx.companyName}</p>
        <p className="text-xs text-slate-500">{MEMBER_ROLE[ctx.role]}</p>
      </div>
      {SECTIONS.map((s) => {
        const items = s.items.filter((i) => can(ctx, i.action));
        if (items.length === 0) return null;
        return (
          <div key={s.title}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{s.title}</p>
            <ul className="space-y-0.5">
              {items.map((i) => (
                <li key={i.href}>
                  <Link href={`${base}${i.href}`} className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
