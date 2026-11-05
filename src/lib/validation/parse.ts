import type { z } from "zod";
import { invalid } from "../errors";

/** zod 스키마로 입력을 검증하고, 실패 시 첫 번째 오류 메시지로 VALIDATION 오류를 던진다. */
export function parseInput<T extends z.ZodTypeAny>(schema: T, raw: unknown): z.infer<T> {
  const r = schema.safeParse(raw);
  if (!r.success) throw invalid(r.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.");
  return r.data;
}
