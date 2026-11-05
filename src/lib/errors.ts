/** 사용자에게 보여줄 수 있는 메시지를 가진 애플리케이션 오류. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "CONFLICT" | "RATE_LIMITED",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const unauthorized = (msg = "로그인이 필요합니다.") => new AppError(msg, "UNAUTHORIZED");
export const forbidden = (msg = "권한이 없습니다.") => new AppError(msg, "FORBIDDEN");
/** 다른 회사의 리소스는 존재 여부도 노출하지 않도록 항상 NOT_FOUND 로 응답한다. */
export const notFound = (msg = "요청한 항목을 찾을 수 없습니다.") => new AppError(msg, "NOT_FOUND");
export const invalid = (msg: string) => new AppError(msg, "VALIDATION");
export const conflict = (msg: string) => new AppError(msg, "CONFLICT");
export const rateLimited = (msg = "요청이 너무 많습니다. 잠시 후 다시 시도하세요.") => new AppError(msg, "RATE_LIMITED");

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
