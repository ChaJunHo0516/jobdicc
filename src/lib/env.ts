import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET는 32자 이상이어야 합니다."),
  STORAGE_DIR: z.string().default("./storage/uploads"),
  AI_PROVIDER: z.enum(["mock", "claude"]).default("mock"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-opus-5-5"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/** 환경변수를 검증해서 반환한다. 비밀값이 누락되면 서버가 시작 단계에서 실패한다. */
export function env(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`환경변수 설정 오류: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** 테스트에서 환경변수를 바꾼 뒤 재검증할 때 사용한다. */
export function resetEnvCache() {
  cached = null;
}
