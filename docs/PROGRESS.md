# PreBridge 진행 현황 (PROGRESS)

> 작업이 중단되었다가 재개되면 이 파일과 `git log`, `git status`를 먼저 확인한 뒤 "다음 실행 시 이어서 진행할 항목"부터 진행한다.

마지막 갱신: 2026-11-05

## 저장소 구조
| 경로 | 내용 | 상태 |
|---|---|---|
| `/` (루트) | Next.js 15 + Prisma 실제 백엔드 앱 (서버 인증·권한·격리) | Phase 1~3 완료, Phase 4 진행 중 |
| `demo/` | GitHub Pages용 정적 프론트엔드 데모 (React + Vite, 샘플 데이터·모의 동작) | 작업 중 |
| `.github/workflows/` | GitHub Pages 배포 워크플로 | 작업 중 |

## 완료된 작업
- Phase 1: 설계 문서(`docs/PREBRIDGE_PLAN.md`, `ARCHITECTURE.md`, `SECURITY.md`), 데이터 모델, 프로젝트 골격 — 커밋 `90a6d0c`
- Phase 2: 회원가입·로그인·세션, 회사별 데이터 격리(tenantDb), 회사 개설 승인 — 커밋 `384a41e`
- Phase 3: 권한 정책, 부서·직급·구성원 관리, 합격자 초대 코드, 감사 로그 — 커밋 `1880d55`
- Phase 4 일부(체크포인트): 업로드 파일 검증·격리 저장소, AI 공급자(Mock 기본 / Claude 선택), 문서 서비스 — 커밋 `5592fcb`

## 현재 진행 중인 작업
- 우선순위 변경(2026-11-05 사용자 지시): **GitHub Pages 프론트엔드 데모를 먼저 완성**
  - `demo/`에 React + Vite 정적 사이트 작성(base `/jobdicc/`)
  - GitHub Actions Pages 배포 워크플로 작성
  - 공개 전 비밀정보 점검 → 사용자 최종 승인 → push·배포

## 남은 작업
**프론트엔드 데모**
- [ ] 데모 앱: 랜딩, 로그인·회원가입(모의), 채용공고·입사지원, 내 대시보드·초대 코드, 회사별 학습(직무별 자료), AI 퀴즈 체험, 관리자 대시보드, 권한별 화면 전환
- [ ] 데모 단위 테스트, 빌드 확인
- [ ] Pages 워크플로, 비밀정보 스캔, 사용자 승인 후 push·배포

**실제 백엔드(데모 이후 재개)**
- [ ] Phase 4 나머지: AI 결과 서비스(생성·검토·승인 → 퀴즈 공개), 학습 서비스(열람·퀴즈 응시·진도), 화면, 테스트 작성
- [ ] Phase 5: 채용공고·입사지원
- [ ] Phase 6: 화면 통합, 시드 데이터
- [ ] Phase 7: E2E·보안 검증 (Playwright 브라우저 다운로드 승인 필요)

## 발견된 오류 / 이슈
- `prisma db push --force-reset`은 Prisma의 AI 안전장치에 차단된다. 테스트 DB를 실행마다 새 임시 파일로 만들어 해결했다(PHASE_1.md 참고).
- `@anthropic-ai/sdk`를 처음에 구버전 0.71로 고정했다. 이 버전에는 구조화 출력 헬퍼가 없어서 1.5.0으로 올렸다.
- Bash 셸의 작업 폴더가 `node_modules` 안에 있으면 Windows 파일 잠금 때문에 npm 설치가 EBUSY로 실패한다. 셸 위치를 프로젝트 루트로 옮겨서 해결했다.

## 테스트 결과 (최근)
- 백엔드: `npx vitest run` → 8 files, 105 tests passed / `tsc --noEmit` 통과 / `eslint` 통과 / `next build` 성공(Phase 3 기준)
- Phase 4 신규 서비스(document-service, ai/*)는 **아직 테스트가 없다**(미검증).

## 다음 실행 시 이어서 진행할 항목
1. `demo/` 데모 앱 완성 여부를 확인하고, 미완성 화면부터 이어서 작성
2. 데모 빌드·테스트 → 비밀정보 스캔 → 사용자 승인 → `git push` → Pages 배포 확인
3. 이후 백엔드 Phase 4 나머지(ai-service, learning-service, 테스트)부터 재개
