/**
 * 데모용 가상 데이터. 실존 기업·인물·기밀자료와 무관하며, 이메일은 예약 도메인(example.com)만 사용한다.
 */
import type { Company, Department, Invite, Job, Level, Persona, TrainingDoc, Application } from "./types";

export const companies: Company[] = [
  { id: "alpha", slug: "alpha-tech", name: "알파테크", industry: "IT 서비스", description: "B2B 협업 소프트웨어를 만드는 가상의 IT 기업" },
  { id: "beta", slug: "beta-logis", name: "베타로지스", industry: "물류", description: "수도권 풀필먼트 센터를 운영하는 가상의 물류 기업" },
];

export const departments: Department[] = [
  { id: "a-dev", companyId: "alpha", name: "개발팀" },
  { id: "a-design", companyId: "alpha", name: "디자인팀" },
  { id: "a-sales", companyId: "alpha", name: "영업팀" },
  { id: "a-hr", companyId: "alpha", name: "인사팀" },
  { id: "b-ops", companyId: "beta", name: "물류운영팀" },
  { id: "b-hr", companyId: "beta", name: "인사팀" },
];

export const levels: Level[] = [
  { id: "a-1", companyId: "alpha", name: "사원", rank: 1 },
  { id: "a-2", companyId: "alpha", name: "대리", rank: 2 },
  { id: "a-3", companyId: "alpha", name: "과장", rank: 3 },
  { id: "a-4", companyId: "alpha", name: "팀장", rank: 4 },
  { id: "b-1", companyId: "beta", name: "사원", rank: 1 },
  { id: "b-2", companyId: "beta", name: "주임", rank: 2 },
  { id: "b-3", companyId: "beta", name: "센터장", rank: 4 },
];

export const personas: Persona[] = [
  { id: "p-applicant", name: "김지원", email: "jiwon.kim@example.com", role: "APPLICANT", companyId: null, departmentId: null, rank: null },
  { id: "p-prehire", name: "이하늘", email: "haneul.lee@example.com", role: "PRE_HIRE", companyId: "alpha", departmentId: "a-dev", rank: 1 },
  { id: "p-employee", name: "박서준", email: "seojun.park@example.com", role: "EMPLOYEE", companyId: "alpha", departmentId: "a-dev", rank: 2 },
  { id: "p-designer", name: "윤채원", email: "chaewon.yoon@example.com", role: "EMPLOYEE", companyId: "alpha", departmentId: "a-design", rank: 1 },
  { id: "p-trainer", name: "최유나", email: "yuna.choi@example.com", role: "TRAINER", companyId: "alpha", departmentId: "a-hr", rank: 3 },
  { id: "p-admin", name: "정민호", email: "minho.jung@example.com", role: "COMPANY_ADMIN", companyId: "alpha", departmentId: "a-hr", rank: 4 },
  { id: "p-beta-emp", name: "한도윤", email: "doyun.han@example.com", role: "EMPLOYEE", companyId: "beta", departmentId: "b-ops", rank: 1 },
  { id: "p-beta-admin", name: "오세린", email: "serin.oh@example.com", role: "COMPANY_ADMIN", companyId: "beta", departmentId: "b-hr", rank: 4 },
];

const all = { departmentIds: [], minRank: null, roles: [] };

export const documents: TrainingDoc[] = [
  {
    id: "doc-a-welcome",
    companyId: "alpha",
    title: "알파테크 온보딩 가이드",
    track: "공통",
    description: "입사 첫 주에 알아야 할 회사 소개와 업무 방식",
    body: [
      "알파테크는 '작은 팀, 빠른 배포'를 원칙으로 일한다.",
      "모든 구성원은 매주 월요일 오전 10시 전사 스탠드업에 참여한다.",
      "업무 요청은 메신저가 아니라 협업 보드의 티켓으로 남기는 것이 원칙이다.",
      "입사 첫 주에는 버디가 배정되며, 버디와 매일 15분씩 체크인한다.",
      "근무 시간은 오전 8시부터 11시 사이에 시작하는 유연근무제를 운영한다.",
    ],
    status: "APPROVED",
    uploadedBy: "최유나",
    access: all,
    ai: {
      summary: "알파테크는 작은 팀 단위로 빠르게 배포하는 문화를 가지고 있으며, 업무 요청은 협업 보드 티켓으로 관리한다. 신규 입사자는 첫 주 동안 버디와 매일 체크인한다.",
      keyPoints: ["매주 월요일 10시 전사 스탠드업", "업무 요청은 협업 보드 티켓으로", "첫 주 버디 매일 15분 체크인", "8~11시 사이 출근하는 유연근무제"],
      summaryStatus: "APPROVED",
      quiz: [
        { prompt: "알파테크에서 업무 요청을 남기는 원칙적인 방법은?", options: ["메신저 개인 메시지", "협업 보드의 티켓", "이메일", "구두 요청"], answerIndex: 1, explanation: "업무 요청은 메신저가 아니라 협업 보드 티켓으로 남긴다." },
        { prompt: "전사 스탠드업은 언제 열리는가?", options: ["매일 오전 9시", "매주 금요일 오후", "매주 월요일 오전 10시", "격주 수요일"], answerIndex: 2, explanation: "매주 월요일 오전 10시에 전사 스탠드업이 열린다." },
        { prompt: "입사 첫 주 버디와의 체크인 주기는?", options: ["매일 15분", "주 1회 1시간", "격일 30분", "첫날 한 번"], answerIndex: 0, explanation: "첫 주에는 버디와 매일 15분씩 체크인한다." },
      ],
      quizStatus: "APPROVED",
    },
  },
  {
    id: "doc-a-security",
    companyId: "alpha",
    title: "정보보안 기본 수칙",
    track: "공통",
    description: "전 구성원이 지켜야 할 보안 수칙",
    body: [
      "회사 계정에는 반드시 2단계 인증을 설정해야 한다.",
      "고객 데이터는 승인된 저장소에만 보관하고 개인 기기에 내려받지 않는다.",
      "의심스러운 메일은 열지 말고 보안 담당 채널에 신고한다.",
      "자리를 비울 때는 화면을 잠근다.",
    ],
    status: "APPROVED",
    uploadedBy: "최유나",
    access: all,
    ai: {
      summary: "회사 계정의 2단계 인증 설정, 고객 데이터의 승인된 저장소 보관, 의심 메일 신고, 자리 비움 시 화면 잠금이 기본 보안 수칙이다.",
      keyPoints: ["2단계 인증 필수", "고객 데이터 개인 기기 저장 금지", "의심 메일은 보안 채널에 신고", "자리 비울 때 화면 잠금"],
      summaryStatus: "APPROVED",
      quiz: [
        { prompt: "고객 데이터를 다루는 올바른 방법은?", options: ["개인 노트북에 백업", "승인된 저장소에만 보관", "메신저로 공유", "USB에 복사"], answerIndex: 1, explanation: "고객 데이터는 승인된 저장소에만 보관한다." },
        { prompt: "의심스러운 메일을 받았을 때 해야 할 일은?", options: ["첨부파일을 열어 확인", "동료에게 전달", "보안 담당 채널에 신고", "무시하고 삭제만"], answerIndex: 2, explanation: "열지 말고 보안 담당 채널에 신고한다." },
      ],
      quizStatus: "APPROVED",
    },
  },
  {
    id: "doc-a-dev-workflow",
    companyId: "alpha",
    title: "개발팀 코드 리뷰와 배포 프로세스",
    track: "개발",
    description: "브랜치 전략, 코드 리뷰, 배포 절차",
    body: [
      "모든 변경은 main 브랜치에서 분기한 기능 브랜치에서 작업한다.",
      "풀 리퀘스트는 최소 1명의 리뷰 승인과 자동 테스트 통과가 있어야 병합할 수 있다.",
      "배포는 매일 오후 2시 정기 배포 창에서 진행한다.",
      "장애가 발생하면 즉시 이전 버전으로 롤백한 뒤 원인을 분석한다.",
    ],
    status: "APPROVED",
    uploadedBy: "최유나",
    access: { departmentIds: ["a-dev"], minRank: null, roles: [] },
    ai: {
      summary: "기능 브랜치에서 작업하고, 리뷰 1명 승인과 자동 테스트 통과 후 병합한다. 배포는 매일 오후 2시에 하며, 장애 시 먼저 롤백한다.",
      keyPoints: ["기능 브랜치 작업", "리뷰 1명 승인 + 테스트 통과 후 병합", "매일 오후 2시 정기 배포", "장애 시 즉시 롤백"],
      summaryStatus: "APPROVED",
      quiz: [
        { prompt: "풀 리퀘스트 병합 조건으로 올바른 것은?", options: ["작성자 본인 승인", "리뷰 1명 승인과 자동 테스트 통과", "팀장 구두 승인", "조건 없음"], answerIndex: 1, explanation: "최소 1명의 리뷰 승인과 자동 테스트 통과가 필요하다." },
        { prompt: "정기 배포 시간은?", options: ["매일 오전 9시", "매일 오후 2시", "매주 금요일 저녁", "수시"], answerIndex: 1, explanation: "매일 오후 2시 정기 배포 창에서 진행한다." },
        { prompt: "장애 발생 시 가장 먼저 할 일은?", options: ["원인 분석 보고서 작성", "이전 버전으로 롤백", "다음 배포까지 대기", "고객 공지"], answerIndex: 1, explanation: "즉시 롤백한 뒤 원인을 분석한다." },
      ],
      quizStatus: "APPROVED",
    },
  },
  {
    id: "doc-a-dev-arch",
    companyId: "alpha",
    title: "서비스 아키텍처 개요 (대리 이상)",
    track: "개발",
    description: "운영 중인 서비스 구성과 장애 대응 책임 범위",
    body: [
      "서비스는 웹 프론트엔드, API 서버, 작업 큐, 데이터베이스로 구성된다.",
      "대리 이상 개발자는 순번제로 장애 대응 당번을 맡는다.",
      "당번은 장애 알림 수신 후 15분 안에 1차 대응을 시작해야 한다.",
    ],
    status: "APPROVED",
    uploadedBy: "최유나",
    access: { departmentIds: ["a-dev"], minRank: 2, roles: [] },
    ai: {
      summary: "서비스는 웹, API, 작업 큐, DB로 구성된다. 대리 이상 개발자는 장애 당번을 맡고, 알림 후 15분 안에 1차 대응을 시작한다.",
      keyPoints: ["웹·API·큐·DB 구성", "대리 이상 장애 당번 순번제", "알림 후 15분 내 1차 대응"],
      summaryStatus: "APPROVED",
      quiz: [
        { prompt: "장애 당번의 1차 대응 시작 기준 시간은?", options: ["5분", "15분", "1시간", "다음 근무일"], answerIndex: 1, explanation: "알림 수신 후 15분 안에 1차 대응을 시작한다." },
      ],
      quizStatus: "APPROVED",
    },
  },
  {
    id: "doc-a-design",
    companyId: "alpha",
    title: "디자인 시스템 사용 가이드",
    track: "디자인",
    description: "컴포넌트, 색상 토큰, 접근성 기준",
    body: [
      "모든 화면은 공용 컴포넌트 라이브러리를 우선 사용한다.",
      "색상은 직접 지정하지 않고 디자인 토큰을 사용한다.",
      "텍스트와 배경의 명도 대비는 4.5:1 이상을 지킨다.",
    ],
    status: "APPROVED",
    uploadedBy: "최유나",
    access: { departmentIds: ["a-design", "a-dev"], minRank: null, roles: [] },
    ai: {
      summary: "공용 컴포넌트와 디자인 토큰을 우선 사용하고, 텍스트 명도 대비 4.5:1 이상을 지킨다.",
      keyPoints: ["공용 컴포넌트 우선", "색상은 디자인 토큰으로", "명도 대비 4.5:1 이상"],
      summaryStatus: "APPROVED",
      quiz: [
        { prompt: "텍스트와 배경의 최소 명도 대비 기준은?", options: ["2:1", "3:1", "4.5:1", "10:1"], answerIndex: 2, explanation: "명도 대비 4.5:1 이상을 지킨다." },
      ],
      quizStatus: "PENDING_REVIEW",
    },
  },
  {
    id: "doc-a-sales",
    companyId: "alpha",
    title: "영업 파이프라인 관리 기준",
    track: "영업",
    description: "리드 단계 정의와 CRM 기록 규칙",
    body: [
      "리드는 발굴, 미팅, 제안, 계약의 4단계로 관리한다.",
      "고객과의 모든 미팅은 24시간 안에 CRM에 기록한다.",
      "할인율 10%를 넘는 제안은 팀장 승인이 필요하다.",
    ],
    status: "APPROVED",
    uploadedBy: "최유나",
    access: { departmentIds: ["a-sales"], minRank: null, roles: [] },
    ai: null,
  },
  {
    id: "doc-a-hr-eval",
    companyId: "alpha",
    title: "상반기 평가 운영 지침 (팀장 전용)",
    track: "인사",
    description: "평가 일정과 평가자 유의사항",
    body: ["평가는 6월 셋째 주에 진행한다.", "평가 결과는 팀장과 인사팀만 열람할 수 있다."],
    status: "APPROVED",
    uploadedBy: "정민호",
    access: { departmentIds: [], minRank: 4, roles: [] },
    ai: null,
  },
  {
    id: "doc-a-pending",
    companyId: "alpha",
    title: "신규 협업툴 도입 안내",
    track: "공통",
    description: "다음 달부터 사용할 협업툴 안내 (승인 대기)",
    body: ["다음 달 1일부터 새 협업툴로 전환한다.", "기존 보드의 티켓은 자동으로 이관된다."],
    status: "PENDING_APPROVAL",
    uploadedBy: "최유나",
    access: all,
    ai: {
      summary: "다음 달 1일부터 새 협업툴로 전환하며 기존 티켓은 자동 이관된다.",
      keyPoints: ["다음 달 1일 전환", "기존 티켓 자동 이관"],
      summaryStatus: "PENDING_REVIEW",
      quiz: [],
      quizStatus: "PENDING_REVIEW",
    },
  },
  {
    id: "doc-b-safety",
    companyId: "beta",
    title: "물류센터 안전 수칙",
    track: "물류운영",
    description: "센터 출입과 장비 사용 시 안전 수칙",
    body: [
      "센터 출입 시 안전화와 안전조끼를 반드시 착용한다.",
      "지게차 이동 동선에는 보행자가 들어가지 않는다.",
      "중량물은 2인 1조로 운반한다.",
    ],
    status: "APPROVED",
    uploadedBy: "오세린",
    access: all,
    ai: {
      summary: "센터에서는 안전화와 안전조끼를 착용하고, 지게차 동선에 들어가지 않으며, 중량물은 2인 1조로 운반한다.",
      keyPoints: ["안전화·안전조끼 착용", "지게차 동선 보행 금지", "중량물 2인 1조 운반"],
      summaryStatus: "APPROVED",
      quiz: [
        { prompt: "중량물 운반 원칙은?", options: ["혼자 빠르게", "2인 1조", "지게차만 사용", "운반 금지"], answerIndex: 1, explanation: "중량물은 2인 1조로 운반한다." },
        { prompt: "센터 출입 시 필수 착용 장비는?", options: ["안전화와 안전조끼", "장갑만", "헬멧만", "없음"], answerIndex: 0, explanation: "안전화와 안전조끼를 반드시 착용한다." },
      ],
      quizStatus: "APPROVED",
    },
  },
  {
    id: "doc-b-wms",
    companyId: "beta",
    title: "입출고 시스템(WMS) 사용법",
    track: "물류운영",
    description: "입고 검수, 피킹, 출고 확정 절차",
    body: ["입고 시 바코드를 스캔해 수량을 검수한다.", "피킹 리스트는 오전 7시에 자동 생성된다.", "출고 확정은 송장 출력 후에만 할 수 있다."],
    status: "APPROVED",
    uploadedBy: "오세린",
    access: { departmentIds: ["b-ops"], minRank: null, roles: [] },
    ai: null,
  },
];

export const jobs: Job[] = [
  {
    id: "job-a-fe",
    companyId: "alpha",
    title: "프론트엔드 개발자 (신입)",
    track: "개발",
    location: "서울 성동구",
    employmentType: "정규직",
    closeAt: "2027-01-31",
    status: "OPEN",
    description: "협업 소프트웨어의 웹 화면을 함께 만들 신입 개발자를 찾습니다.",
    requirements: ["React 또는 유사 프레임워크 사용 경험", "웹 접근성에 대한 관심", "협업 도구 사용 경험"],
  },
  {
    id: "job-a-design",
    companyId: "alpha",
    title: "프로덕트 디자이너",
    track: "디자인",
    location: "서울 성동구",
    employmentType: "정규직",
    closeAt: "2027-02-15",
    status: "OPEN",
    description: "디자인 시스템을 함께 발전시킬 디자이너를 찾습니다.",
    requirements: ["포트폴리오 제출", "디자인 시스템 운영 경험 우대"],
  },
  {
    id: "job-a-sales",
    companyId: "alpha",
    title: "B2B 영업 담당자",
    track: "영업",
    location: "서울 성동구",
    employmentType: "정규직",
    closeAt: "2026-10-31",
    status: "CLOSED",
    description: "기업 고객 대상 영업 담당자 (마감된 공고 예시)",
    requirements: ["B2B 영업 경력 2년 이상"],
  },
  {
    id: "job-b-ops",
    companyId: "beta",
    title: "물류센터 운영 매니저",
    track: "물류운영",
    location: "경기 이천시",
    employmentType: "정규직",
    closeAt: "2027-01-15",
    status: "OPEN",
    description: "풀필먼트 센터의 입출고 운영을 관리할 매니저를 찾습니다.",
    requirements: ["물류 운영 경험", "WMS 사용 경험 우대"],
  },
];

export const seedApplications: Application[] = [
  {
    id: "app-1",
    jobId: "job-a-fe",
    companyId: "alpha",
    personaId: "p-prehire",
    applicantName: "이하늘",
    applicantEmail: "haneul.lee@example.com",
    coverLetter: "(샘플) 사용자 경험을 중요하게 생각하는 개발자가 되고 싶습니다.",
    status: "OFFERED",
    createdAt: "2026-10-02",
  },
];

/** 데모용 초대 코드. 실제 서비스에서는 서버가 무작위로 발급하고 해시만 저장한다. */
export const seedInvites: Invite[] = [
  { code: "ALPH-DEMO-2026", companyId: "alpha", email: "jiwon.kim@example.com", role: "PRE_HIRE", departmentId: "a-dev", rank: 1, usedBy: null },
];
