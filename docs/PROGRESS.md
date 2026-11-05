# jobdicc 진행 현황 (PROGRESS)

> 작업이 중단되었다가 재개되면 이 파일과 `git log`, `git status`를 먼저 확인한 뒤 "다음 실행 시 이어서 진행할 항목"부터 진행한다.

마지막 갱신: 2026-11-06

## 저장소 구조
| 경로 | 내용 | 상태 |
|---|---|---|
| `prejob/` | **PreJob** 단일 HTML 웹서비스 → Pages 루트 `/jobdicc/` | 반영 완료(2026-11-06) |
| `/` (루트) | Next.js 15 + Prisma 실제 백엔드 앱 (서버 인증·권한·격리) | Phase 1~3 완료, Phase 4 진행 중 |
| `demo/` | PreBridge 정적 프론트엔드 데모 (React + Vite) → Pages `/jobdicc/prebridge/` | 완료 |
| `.github/workflows/deploy-demo.yml` | Pages 배포: PreJob(루트) + PreBridge 데모(`/prebridge/`) 합쳐서 배포 | 완료 |

## PreJob 반영 (2026-11-06)
- 원본: 팀 프로젝트 Nickname6532/HackerTone `prejob.html`(커밋 `f70b538`). 사용자 지시로 HackerTone은 **참고용**이며, 그 저장소에는 커밋·푸시하지 않았다.
- 작업 위치: `C:\HackerTone`(원본 clone)에서 분석·수정·테스트 → 검증된 `index.html`을 이 저장소 `prejob/index.html`로 복사(MD5 일치 확인)
  - `C:\HackerTone`의 작업물(`index.html`, `README.md` 수정, `docs/PROGRESS.md`)은 그 폴더에 커밋하지 않은 상태로 보존
- 수정 사항·테스트 결과: `prejob/CHANGES.md` (방향키 계정 전환 버그, 메뉴 키보드 접근, 닫힌 메뉴 포커스, 미사용·오류 코드 정리, 초기화 문구)
- 테스트: `file://` 온라인 46/46, 오프라인 46/46, HTTP `/jobdicc/` 46/46 — 모두 JS 오류 0
- Pages 구조 변경: 루트를 PreJob으로 바꾸고, 기존 PreBridge 데모는 `/jobdicc/prebridge/`로 옮김(`demo/vite.config.ts` base 변경). 이전 데모 주소 `/jobdicc/#/...`는 이제 PreJob을 연다.
- PreBridge 데모를 `/prebridge/`로 옮긴 뒤 다시 테스트: 단위 10/10, 빌드 성공, 브라우저 스모크 19/19
  - "로그인 후 대시보드" 확인이 가끔 실패했는데, 화면 렌더링 전에 즉시 확인하던 테스트 스크립트의 경쟁 상태가 원인이었다. 최대 5초 기다리도록 테스트를 고친 뒤 실서버에서 3회 연속 19/19 통과(앱 문제 아님).
- 커밋 `be9e6dd` push(fast-forward, 강제 push 없음) → push로 Actions 자동 실행 42053614124 성공(build 17s, deploy 19s)
- 실서버 확인: `/jobdicc/`·`/jobdicc/prebridge/` HTTP 200, 배포된 PreJob이 커밋한 파일과 같음(MD5, 줄바꿈 정규화 기준), 실서버 PreJob 전체 테스트 46/46·JS 오류 0, PreBridge 스모크 19/19·콘솔 오류 0

## 완료된 작업
- Phase 1: 설계 문서(`docs/PREBRIDGE_PLAN.md`, `ARCHITECTURE.md`, `SECURITY.md`), 데이터 모델, 프로젝트 골격 — 커밋 `90a6d0c`
- Phase 2: 회원가입·로그인·세션, 회사별 데이터 격리(tenantDb), 회사 개설 승인 — 커밋 `384a41e`
- Phase 3: 권한 정책, 부서·직급·구성원 관리, 합격자 초대 코드, 감사 로그 — 커밋 `1880d55`
- Phase 4 일부(체크포인트): 업로드 파일 검증·격리 저장소, AI 공급자(Mock 기본 / Claude 선택), 문서 서비스 — 커밋 `5592fcb`

- 프론트엔드 데모 `demo/` 완성(React 19 + Vite 8 + Tailwind 4, base `/jobdicc/`, HashRouter) — 커밋 `393cf10`
  - 랜딩, 로그인·회원가입(모의), 채용공고·입사지원·마감 처리, 내 대시보드·지원현황·철회, 합격자 초대 코드 인증
  - 회사별 학습공간(회사 간 격리 화면), 직무별 교육자료(부서·직급 규칙), AI 요약(승인 배지), AI 퀴즈 체험·채점, 내 진도
  - 관리자: 대시보드·학습 현황·감사 로그, 자료 등록·승인(본인 업로드 승인 제한), AI 결과 검토, 구성원 역할, 초대 발급, 채용공고, 지원자 상태
  - 권한별 화면 비교표, 상단 데모 계정 전환, 모든 화면에 "데모·모의 동작" 표시
- GitHub Actions Pages 배포 워크플로 `.github/workflows/deploy-demo.yml`, 루트 `README.md`
- 공개 전 점검 완료: API 키·토큰 패턴 없음, `.env` 커밋 이력 없음, 이메일은 예약 도메인만 사용(커밋 작성자 이메일은 별도 확인 필요)

- GitHub 공개 배포(2026-11-05, 사용자 승인)
  - 커밋 작성자 이메일을 GitHub noreply 주소로 교체(push 전 로컬 커밋만, 파일 내용 동일 확인), 저장소 로컬 git config도 noreply로 설정
  - `origin` = https://github.com/ChaJunHo0516/jobdicc.git, `main` push(신규 브랜치, 강제 push 없음)
  - Pages 활성화(build_type=workflow) → Actions 실행 41994766994 성공(build: 테스트·빌드, deploy)
  - 사이트: https://chajunho0516.github.io/jobdicc/ (HTTP 200, 실서버 스모크 19/19 통과, 콘솔 오류 0)

## 현재 진행 중인 작업
- 없음. 다음은 백엔드 Phase 4 재개

## 남은 작업
**프론트엔드 데모**
- [x] 데모 앱 화면 전체
- [x] 데모 단위 테스트(10개), 빌드, 브라우저 스모크 테스트(19개 항목, Edge headless)
- [x] 원격 연결 → push → Pages 활성화 → 배포·실서버 확인

**실제 백엔드(데모 이후 재개)**
- [ ] Phase 4 나머지: AI 결과 서비스(생성·검토·승인 → 퀴즈 공개), 학습 서비스(열람·퀴즈 응시·진도), 화면, 테스트 작성
- [ ] Phase 5: 채용공고·입사지원
- [ ] Phase 6: 화면 통합, 시드 데이터
- [ ] Phase 7: E2E·보안 검증 (Playwright 브라우저 다운로드 승인 필요)

## 발견된 오류 / 이슈
- 브랜치를 처음 만드는 push(`main` 생성)에서는 Pages 워크플로가 자동 실행되지 않았다. `gh workflow run`으로 수동 실행해 해결했다. 이후 `demo/**`를 변경해 push하면 자동 실행되는지는 아직 확인하지 않았다.
- Actions 안내: `ubuntu-latest` 러너가 Ubuntu 26으로 바뀐다는 공지가 있다(현재 빌드 영향 없음).
- `prisma db push --force-reset`은 Prisma의 AI 안전장치에 차단된다. 테스트 DB를 실행마다 새 임시 파일로 만들어 해결했다(PHASE_1.md 참고).
- `@anthropic-ai/sdk`를 처음에 구버전 0.71로 고정했다. 이 버전에는 구조화 출력 헬퍼가 없어서 1.5.0으로 올렸다.
- Bash 셸의 작업 폴더가 `node_modules` 안에 있으면 Windows 파일 잠금 때문에 npm 설치가 EBUSY로 실패한다. 셸 위치를 프로젝트 루트로 옮겨서 해결했다.

## 테스트 결과 (최근)
- 백엔드: `npx vitest run` → 8 files, 105 tests passed / `tsc --noEmit` 통과 / `eslint` 통과
- Phase 4 신규 서비스(document-service, ai/*)는 **아직 테스트가 없다**(미검증).
- 데모: `npm test` → 10 tests passed / `npm run build` 성공(JS 330KB, gzip 101KB) / 빌드 결과 경로 `/jobdicc/assets/...` 확인
- 데모 브라우저 스모크(로컬 `vite preview` + Edge headless): 19/19 통과, 콘솔 오류 0
  (지원→초대 코드 인증→학습→퀴즈 100점, 마감 공고 차단, 직원 관리 화면 차단, 타사 공간 차단, 관리자 승인, 375px 모바일 가로 넘침 없음)

## 다음 실행 시 이어서 진행할 항목
1. 백엔드 Phase 4 나머지: `src/server/services/ai-service.ts`, `learning-service.ts`, document-service 테스트, 교육자료·AI 검토·학습 화면
2. Phase 5~7 (채용, 화면 통합·시드, E2E·보안 검증)
3. PreBridge 데모 수정 시: `cd demo && npm test && npm run build` 후 push → Actions가 자동 배포함(2026-11-06 push로 자동 실행 확인)
4. PreJob 수정 시: `prejob/index.html` 수정 후 브라우저 테스트 → push(자동 배포). 원본(HackerTone `prejob.html`) 변경분을 반영할 때는 `prejob/CHANGES.md`의 수정 사항이 유지되는지 확인한다.
5. 권장: PreJob 샘플 계정의 `prejob.kr` 이메일을 예약 도메인(`example.com`)으로 교체
