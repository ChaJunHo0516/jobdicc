# PreBridge 보안 설계

## 위협 모델과 통제
| 위협 | 통제 | 검증 |
|---|---|---|
| 타사 데이터 열람(IDOR, 테넌트 교차) | TenantContext + tenantDb 강제 + 참조 ID 검증 + 404 정책 | `tests/security/*` 교차 접근 테스트 |
| 권한 상승(직원이 관리 기능 호출) | 모든 Server Action/Route에서 `authorize(ctx, action)` | 역할×행위 매트릭스 테스트 |
| 세션 탈취·위조 | 32바이트 무작위 토큰, DB에는 HMAC만 저장, httpOnly·SameSite=Lax·(운영)Secure 쿠키, 7일 만료 | 세션 단위 테스트 |
| 무차별 대입 로그인 | 이메일당 15분 5회, IP당 15분 50회 제한, 동일 오류 메시지, 존재하지 않는 계정에도 동일 해시 연산 | 단위·통합 테스트 |
| CSRF | Server Actions의 Origin/Host 검사(Next.js 기본) + SameSite=Lax | E2E |
| XSS | React 기본 이스케이프, `dangerouslySetInnerHTML` 사용 금지, CSP | 코드 검색, 보안 테스트 |
| 악성 파일 업로드 | 확장자·MIME·매직바이트 검사, 10MB 제한, 저장 파일명은 UUID, public 밖에 저장, 권한 확인 후 다운로드(`Content-Disposition: attachment`, nosniff) | 파일 검증 테스트 |
| 경로 조작 | 파일 키는 서버가 생성하며, 저장소 루트 밖으로 해석되면 거부 | 단위 테스트 |
| 검증되지 않은 AI 결과 노출 | 승인 전 학습자 조회 경로에서 제외, 상태 배지 표시 | 통합 테스트 |
| 퀴즈 정답 유출 | 응시용 조회에서 answerIndex 제외, 서버 채점 | 통합 테스트 |
| 초대 코드 탈취·재사용 | 해시 저장, 1회용, 만료, 이메일 일치, 취소 가능 | 통합 테스트 |
| 비밀정보 노출 | `.env`(git 제외), zod로 환경변수 검증, `.env.example`에는 빈 값만 | grep 스캔 |
| 플랫폼 관리자의 회사 자료 접근 | SUPER_ADMIN도 Membership이 없으면 회사 공간 접근 불가 | 통합 테스트 |

## 알려진 제약 (MVP)
- rate limiter가 메모리 기반이라 서버 인스턴스가 여러 대면 공유되지 않는다. 운영 시 Redis 등으로 교체해야 한다.
- SQLite에는 Row-Level Security가 없다. PostgreSQL로 전환할 때 RLS를 2차 방어로 추가할 것을 권장한다.
- CSP에서 `script-src 'unsafe-inline'`을 허용한다(Next.js 인라인 스크립트). nonce 기반 CSP는 후속 과제다.
- 초대 코드는 이메일로 발송하지 않고 관리자 화면에 1회 표시한다.
