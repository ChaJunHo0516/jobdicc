import { LinkButton } from "@/components/ui";

export default function Home() {
  return (
    <div className="py-10">
      <h1 className="text-4xl font-bold text-slate-900">입사 전부터 준비된 동료로</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        PreBridge는 회사마다 독립된 학습공간에서 합격자와 직원이 직무교육을 받고, AI가 만든 요약과 퀴즈를 교육담당자가
        검토해서 공개하는 채용·온보딩 통합 플랫폼입니다.
      </p>
      <div className="mt-8 flex gap-3">
        <LinkButton href="/jobs">채용공고 보기</LinkButton>
        <LinkButton href="/signup" variant="secondary">
          회원가입
        </LinkButton>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          ["회사별 독립 공간", "회사의 내부 자료는 해당 회사 구성원에게만, 부서·직급 규칙에 맞게 공개됩니다."],
          ["검토된 AI 학습자료", "AI 요약·퀴즈는 교육담당자가 승인한 뒤에만 학습자에게 보입니다."],
          ["채용에서 온보딩까지", "지원 → 합격 → 초대 코드 인증 → 프리온보딩 학습이 한 흐름으로 이어집니다."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">{t}</h2>
            <p className="mt-2 text-sm text-slate-600">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
