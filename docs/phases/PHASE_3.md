# Phase 3 — 회사 관리자와 권한 시스템

## 구현 결과
**권한 정책 (F3, F4)**
- `src/server/authz/policy.ts`: 13개 행위 × 4개 역할 매트릭스. `authorize(ctx, action)`를 서비스 함수의 첫 줄에서 호출한다.
- 페이지 단위 검사: `requireCompanyPermission(slug, action)`. 권한이 없으면 404를 반환해 관리 화면의 존재를 드러내지 않는다.
- 메뉴(`src/components/company-nav.tsx`)는 역할에 따라 숨기지만, 이는 편의 기능일 뿐이다. 실제 차단은 서버에서 한다.

**조직 관리**: `src/server/services/org-service.ts`, `/c/{slug}/admin/org`
- 부서·직급 CRUD. 직급에는 서열(rank)이 있으며 숫자가 클수록 상위다.
- `assertOrgRefs()`: 입력으로 받은 부서·직급 ID가 이 회사 소속인지 확인한다(다른 회사 ID 삽입 차단).

**구성원 관리**: `src/server/services/member-service.ts`, `/c/{slug}/admin/members`
- 역할·상태(활성/정지/해지)·부서·직급 변경. 합격자를 직원으로 전환할 때도 이 화면을 쓴다.
- 마지막 활성 관리자는 강등하거나 정지할 수 없다.

**합격자 인증 (초대 코드)**: `src/server/services/invite-service.ts`, `/c/{slug}/admin/invites`, `/me`
- 코드 형식은 `XXXX-XXXX-XXXX`(혼동 문자 제외, 약 60비트)다. DB에는 HMAC 해시만 저장하며, 원문은 발급 화면에 한 번만 표시한다.
- 등록 조건: 이메일 일치, 1회용(조건부 업데이트로 동시 등록 경쟁 방지), 만료 전, 취소되지 않음, 회사가 ACTIVE일 것
- 실패 사유(없음·만료·취소·사용됨)를 구분하지 않아 코드 존재 여부가 드러나지 않는다.
- 등록 시도는 사용자당 15분 10회로 제한한다.
- 초대로 줄 수 있는 역할은 합격자·직원·교육담당자다. 관리자 권한은 구성원 관리 화면에서만 부여할 수 있다.
- 합격 처리(OFFERED)된 지원서와 연결해 발급할 수 있다(지원자 이메일 일치 검증, Phase 5에서 화면 연결).

**감사 로그**: 회사 신청·승인, 조직 변경, 구성원 변경, 초대 발급·취소·등록을 기록한다. `/c/{slug}/admin/audit`(관리자 전용)

## 테스트 결과
```
npx vitest run → Test Files 8 passed, Tests 105 passed
  tests/unit/policy.test.ts              53 (역할×행위 전수 + 알 수 없는 역할 거부)
  tests/integration/org-members.test.ts  10 (중복, 회사별 독립, 권한 거부, 타사 부서 삭제·배정 차단,
                                             타사 구성원 수정 404, 마지막 관리자 보호, 감사 로그 격리)
  tests/integration/invite.test.ts        9 (발급→등록, 해시 저장, 재사용·이메일 불일치·만료·취소 거부,
                                             권한, 타사 참조 차단, 정지 회사, 대입 공격 제한)
npx tsc --noEmit → 통과, npx eslint . → 통과
```

## 알려진 문제
- 마지막 관리자 보호는 "개수 확인 후 변경" 방식이라, 관리자 두 명이 동시에 서로를 강등하면 이론상 둘 다 통과할 수 있다. 운영 DB(PostgreSQL)로 전환할 때 직렬화 트랜잭션으로 보강한다.
- 초대 코드는 이메일로 보내지 않는다(외부 서비스 연결은 승인 필요). 관리자가 화면에서 복사해 직접 전달한다.
