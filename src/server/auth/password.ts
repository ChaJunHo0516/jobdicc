import bcrypt from "bcryptjs";
import { env } from "@/lib/env";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env().BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// 존재하지 않는 계정에도 같은 시간만큼 비교를 수행해 계정 존재 여부가 응답 시간으로 드러나지 않게 한다.
let dummyHash: string | null = null;
export async function burnPasswordCheck(plain: string): Promise<void> {
  dummyHash ??= await bcrypt.hash("prebridge-dummy-password", env().BCRYPT_ROUNDS);
  await bcrypt.compare(plain, dummyHash);
}
