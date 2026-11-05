# PreBridge 아키텍처

## 기술 스택
- Next.js 15 (App Router, Server Components, Server Actions), TypeScript, Tailwind CSS 4
- Prisma 6 + SQLite (개발·테스트). PostgreSQL로 전환할 수 있도록 enum/String JSON만 사용한다.
- 인증: 자체 세션(DB 저장, httpOnly 쿠키), bcryptjs
- 검증: zod
- 테스트: Vitest(단위·통합·보안), Playwright(E2E)
- AI: `AiProvider` 인터페이스 — Mock(기본), Claude(선택, 승인 후 사용)

## 계층 구조
```
app/(페이지, Server Components)  ─┐
actions/(Server Actions: 입력 파싱 → 세션 확인 → 서비스 호출)
                                   ▼
server/auth      세션·쿠키·rate limit
server/authz     TenantContext 생성(resolveTenantContext), 역할 정책(policy.ts), 문서 접근 규칙
server/services  비즈니스 로직. 회사 데이터는 반드시 tenantDb(ctx.companyId) 로만 접근
server/tenant-db Prisma extension — where/data 에 companyId 강제 주입, 불일치 시 예외
server/db        Prisma 클라이언트
```

## 회사 간 데이터 격리 (다중 방어)
1. **컨텍스트**: 회사 내부 요청은 URL의 `slug`와 세션 사용자로 서버가 `TenantContext`를 만든다. 회사가 비활성이거나 소속(ACTIVE)이 아니면 404를 반환한다.
2. **tenantDb**: 테넌트 모델(14개)을 조회·수정·삭제할 때는 where에 `companyId`가 자동으로 붙는다. 생성할 때는 companyId가 자동으로 설정되며, 다른 회사 ID가 들어오면 `TenantIsolationError`가 난다.
3. **참조 검증**: 입력으로 받은 부서·직급·문서 ID는 같은 회사 소속인지 서비스에서 확인한다.
4. **404 정책**: 다른 회사의 리소스는 존재 여부를 알 수 없도록 403 대신 404로 응답한다.
5. **테스트**: 모든 회사 서비스에 "B회사 컨텍스트로 A회사 리소스 접근 실패" 테스트를 둔다.

## 데이터 모델 (ERD 요약)
```
User 1─* Session
User 1─* Membership *─1 Company
Company 1─* Department, PositionLevel, HireInvite, Document, JobPosting, AuditLog
Membership *─1 Department?, PositionLevel?
Document 1─* DocumentAccessRule, AiArtifact, Quiz, LearningProgress
AiArtifact 1─0..1 Quiz 1─* QuizQuestion, QuizAttempt
JobPosting 1─* JobApplication *─1 User(applicant)
```
전체 정의는 `prisma/schema.prisma`에 있다.

## 상태 흐름
- 회사: `PENDING`(개설 신청) → `ACTIVE`(플랫폼 관리자 승인) / `REJECTED` / `SUSPENDED`
- 문서: `PENDING_APPROVAL` → `APPROVED` / `REJECTED` → `ARCHIVED`
- AI 결과: `PENDING_REVIEW` → `APPROVED`(퀴즈는 이 시점에 Quiz로 공개) / `REJECTED`
- 채용공고: `DRAFT` → `OPEN` → `CLOSED` (마감일이 지나면 OPEN이어도 마감으로 처리)
- 지원: `SUBMITTED` → `REVIEWING` → `INTERVIEW` → `OFFERED` / `REJECTED`, 지원자는 `WITHDRAWN` 가능

## 권한 매트릭스 (`src/server/authz/policy.ts`)
| 행위 | 관리자 | 교육담당자 | 직원 | 합격자 |
|---|---|---|---|---|
| org:manage (부서·직급) | ✓ | | | |
| member:manage | ✓ | | | |
| invite:manage | ✓ | | | |
| document:upload | ✓ | ✓ | | |
| document:review | ✓ | ✓ | | |
| document:viewAll | ✓ | ✓ | | |
| ai:generate / ai:review | ✓ | ✓ | | |
| learning:access | ✓ | ✓ | ✓ | ✓ |
| progress:viewAll | ✓ | ✓ | | |
| job:manage / application:manage | ✓ | | | |
| audit:view | ✓ | | | |

추가 규칙
- 교육담당자는 **본인이 올린 문서를 직접 승인할 수 없다**(이중 확인). 회사 관리자의 자기 승인은 허용하되 감사 로그에 남긴다.
- 마지막 활성 관리자는 강등·정지할 수 없다.
- 학습자(직원·합격자)는 `APPROVED` 상태이고 접근 규칙에 맞는 문서만 볼 수 있다.

## 문서 접근 규칙
규칙 하나 = (부서 | 전체) ∧ (직급 rank 최소~최대 | 제한없음) ∧ (역할 목록 | 전체).
규칙 중 하나라도 맞으면 열람할 수 있다. 규칙이 없으면 관리자·교육담당자만 볼 수 있다(기본 거부).
