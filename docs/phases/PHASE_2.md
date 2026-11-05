# Phase 2 — 공통 인증·회사별 데이터 격리

## 구현 결과
**인증 (F1)**
- 회원가입·로그인·로그아웃: `src/server/services/auth-service.ts`, `src/actions/auth.ts`, `/signup`, `/login`
- 세션: 32바이트 무작위 토큰을 httpOnly·SameSite=Lax 쿠키에 담는다. DB에는 HMAC-SHA256 값만 저장하고, 7일 후 만료된다(`src/server/auth/session.ts`).
- 비밀번호: bcrypt 해시. 10자 이상이며 영문과 숫자를 모두 포함해야 한다.
- 로그인 시도 제한: 이메일당 15분 5회, IP당 15분 50회. 계정 존재 여부를 숨기려고 오류 메시지를 통일하고 해시 연산 시간도 맞췄다.
- 로그인 후 이동 경로(`next`)는 내부 경로만 허용한다(오픈 리다이렉트 방지).

**회사별 독립 공간·격리 (F2, F11)**
- `tenantDb(companyId)` (`src/server/tenant-db.ts`): 14개 테넌트 모델의 where/data에 companyId를 강제한다. 다른 회사 ID가 들어오거나 companyId를 바꾸려 하면 `TenantIsolationError`가 발생한다.
- `resolveTenantContext(userId, slug)` (`src/server/authz/context.ts`): 회사가 ACTIVE이고 소속이 ACTIVE일 때만 컨텍스트를 만든다. 그 외에는 모두 404다.
- 플랫폼 관리자(SUPER_ADMIN)도 소속이 없으면 회사 공간에 들어갈 수 없다.

**회사 개설 (F3 일부)**
- 개인이 회사 개설을 신청하면 PENDING 상태가 되고, 신청자는 COMPANY_ADMIN으로 등록된다. 회사 공간은 플랫폼 관리자가 승인한 뒤에 열린다.
- `/platform/companies`: 승인·반려·정지·정지 해제. 상태 전이 규칙을 검증하고 감사 로그를 남긴다.

**UI 기반**
- 공통 UI 컴포넌트(`src/components/ui.tsx`), Server Action 결과 표시 폼(`src/components/action-form.tsx`)
- Server Action 오류 처리(`src/actions/helpers.ts`): AppError는 사용자 메시지로 바꾸고, 그 밖의 오류는 내부 정보를 숨긴 일반 메시지로 바꾼다.
- `/me` 대시보드: 소속 회사 목록, 초대 코드 등록, 회사 개설 신청

> 참고: `/me`의 초대 코드 등록 화면이 Phase 3의 초대 서비스를 쓰기 때문에, 빌드가 깨지지 않도록 Phase 3 서비스 계층(조직·구성원·초대)을 이 커밋에 함께 넣었다. 해당 테스트는 Phase 3에서 작성한다.

## 테스트 결과
```
npx vitest run → Test Files 5 passed, Tests 33 passed
  tests/integration/auth.test.ts          13 (가입·정책·중복·권한상승 차단·로그인·rate limit·세션 위조/만료/폐기)
  tests/security/tenant-isolation.test.ts 13 (조회·수정·삭제·생성·트랜잭션 격리, 404 정책, 정지 구성원/회사, SUPER_ADMIN 차단)
  tests/integration/company.test.ts        4 (신청→승인 흐름, 주소 검증, 비관리자 차단, 상태 전이)
npx tsc --noEmit → 통과
npx eslint .     → 통과
npx next build   → 성공
```

## 알려진 문제
- rate limiter가 메모리 기반이라 다중 인스턴스 환경에서는 공유되지 않는다(`docs/SECURITY.md`).
- tenantDb는 중첩 쓰기(nested create)의 companyId를 자동으로 채우지 않는다. 서비스 코드에서 명시하고, 테스트로 검증한다.
