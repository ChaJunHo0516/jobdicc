import { env } from "@/lib/env";
import { invalid } from "@/lib/errors";
import { ClaudeAiProvider } from "./claude-provider";
import { MockAiProvider } from "./mock-provider";
import type { AiProvider } from "./provider";

let override: AiProvider | null = null;

/** 테스트에서 공급자를 바꿔 끼울 때 사용한다. */
export function setAiProviderForTests(p: AiProvider | null) {
  override = p;
}

/** 환경설정에 따라 AI 공급자를 고른다. 기본값은 외부 호출이 없는 Mock 이다. */
export function getAiProvider(): AiProvider {
  if (override) return override;
  const e = env();
  if (e.AI_PROVIDER === "claude") {
    if (!e.ANTHROPIC_API_KEY) throw invalid("AI_PROVIDER=claude 이지만 ANTHROPIC_API_KEY 가 설정되지 않았습니다.");
    return new ClaudeAiProvider(e.ANTHROPIC_API_KEY, e.ANTHROPIC_MODEL);
  }
  return new MockAiProvider();
}
