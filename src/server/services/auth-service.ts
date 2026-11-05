import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { burnPasswordCheck, hashPassword, verifyPassword } from "../auth/password";
import { checkRateLimit } from "../auth/rate-limit";
import { conflict, rateLimited, unauthorized } from "@/lib/errors";
import { loginSchema, signupSchema } from "@/lib/validation/auth";
import { parseInput } from "@/lib/validation/parse";

export async function signup(raw: unknown) {
  const input = parseInput(signupSchema, raw);
  const passwordHash = await hashPassword(input.password);
  try {
    return await prisma.user.create({
      data: { email: input.email, name: input.name, passwordHash },
      select: { id: true, email: true, name: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw conflict("이미 가입된 이메일입니다.");
    }
    throw e;
  }
}

const LOGIN_FAIL_MSG = "이메일 또는 비밀번호가 올바르지 않습니다.";

/** 자격 증명을 확인한다. 계정 존재 여부를 노출하지 않도록 동일한 오류 메시지를 사용한다. */
export async function authenticate(raw: unknown, clientKey = "unknown") {
  const input = parseInput(loginSchema, raw);
  const windowMs = 15 * 60 * 1000;
  if (!checkRateLimit(`login:email:${input.email}`, 5, windowMs) || !checkRateLimit(`login:ip:${clientKey}`, 50, windowMs)) {
    throw rateLimited("로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요.");
  }
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    await burnPasswordCheck(input.password);
    throw unauthorized(LOGIN_FAIL_MSG);
  }
  if (!(await verifyPassword(input.password, user.passwordHash))) {
    throw unauthorized(LOGIN_FAIL_MSG);
  }
  return { id: user.id, email: user.email, name: user.name, platformRole: user.platformRole };
}
