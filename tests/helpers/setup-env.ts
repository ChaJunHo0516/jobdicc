// DATABASE_URL, STORAGE_DIR 은 vitest.config.ts 에서 실행별 임시 경로로 지정된다.
process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-0123456789";
process.env.BCRYPT_ROUNDS = "4";
process.env.AI_PROVIDER = "mock";
process.env.ANTHROPIC_API_KEY = "";
