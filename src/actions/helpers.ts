import { unstable_rethrow } from "next/navigation";
import { isAppError } from "@/lib/errors";

export type ActionState = {
  error?: string;
  success?: string;
  /** 한 번만 보여줘야 하는 값(예: 초대 코드) */
  secret?: string;
} | null;

/**
 * Server Action 공통 오류 처리.
 * AppError 는 사용자 메시지로 변환하고, 그 외 오류는 내부 정보 노출 없이 일반 메시지로 바꾼다.
 * redirect/notFound 는 Next.js 가 처리하도록 다시 던진다.
 */
export async function handle(fn: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await fn()) ?? { success: "저장했습니다." };
  } catch (e) {
    unstable_rethrow(e);
    if (isAppError(e)) return { error: e.message };
    console.error("[action-error]", e);
    return { error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도하세요." };
  }
}

export function formToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("$ACTION")) continue;
    if (typeof v === "string") out[k] = v;
  }
  return out;
}
