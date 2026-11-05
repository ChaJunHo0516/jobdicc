# jobdicc — PreJob · PreBridge

신입사원 직무 언어 교육 서비스 **PreJob**과, 기업별 AI 프리온보딩·직무교육·채용 통합 서비스 **PreBridge**를 담은 저장소입니다.

| 사이트 | 주소 | 설명 |
|---|---|---|
| **PreJob** | https://ChaJunHo0516.github.io/jobdicc/ | 단일 HTML 웹서비스(`prejob/index.html`). 오프라인·더블클릭 실행 가능 |
| PreBridge 데모 | https://ChaJunHo0516.github.io/jobdicc/prebridge/ | React + Vite 정적 데모(`demo/`) |

두 사이트 모두 가상 기업·샘플 데이터·모의 동작으로 만든 시연용입니다. 실제 인증·보안·AI 기능은 적용되지 않습니다.

## 저장소 구성
| 경로 | 설명 |
|---|---|
| `prejob/` | PreJob 단일 HTML 웹서비스(`index.html`), 설명(`README.md`), 원본 대비 수정 내역(`CHANGES.md`) |
| `demo/` | PreBridge 정적 데모 (React + Vite). 데이터는 브라우저 localStorage에만 저장됩니다. |
| `src/`, `prisma/`, `tests/` | 실제 서비스용 Next.js + Prisma 백엔드 앱 (서버 인증, 권한, 회사 간 데이터 격리). 개발 진행 중입니다. |
| `docs/` | 기획서, 아키텍처, 보안 설계, Phase별 보고서, 진행 현황(`PROGRESS.md`) |

## PreJob 실행
`prejob/index.html`을 브라우저에서 열면 됩니다(서버·설치 불필요). 자세한 내용은 [`prejob/README.md`](prejob/README.md)를 참고하세요.

## PreBridge 데모 실행
```bash
cd demo
npm ci
npm run dev      # http://localhost:5173/jobdicc/prebridge/
npm test         # 데모 로직 단위 테스트
npm run build
```

## 백엔드 앱 실행 (개발)
```bash
npm ci
cp .env.example .env   # SESSION_SECRET 등을 채운다. .env는 커밋하지 않는다.
npx prisma migrate dev
npm run dev
npm test
```
AI 기능은 기본적으로 외부 호출이 없는 Mock 공급자를 사용합니다. Claude API를 쓰려면 `.env`에 `AI_PROVIDER=claude`와 본인의 `ANTHROPIC_API_KEY`를 설정합니다(사용량에 따라 비용이 발생합니다).

## 데이터 안내
저장소의 모든 기업·인물·교육자료는 가상의 샘플입니다. 이메일은 예약 도메인(`example.com`, `example.test`)만 사용합니다.
