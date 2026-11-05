import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

/** 추측 불가능한 무작위 토큰 (base64url) */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** DB 에는 원문 대신 서버 비밀키로 HMAC 한 값만 저장한다. */
export function hashToken(token: string): string {
  return createHmac("sha256", env().SESSION_SECRET).update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동되는 0/O/1/I 제외

/** 사람이 입력하기 쉬운 초대 코드: XXXX-XXXX-XXXX (약 60비트) */
export function randomInviteCode(): string {
  const bytes = randomBytes(12);
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
    if (i === 3 || i === 7) out += "-";
  }
  return out;
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
