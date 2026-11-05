import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { authenticate, signup } from "@/server/services/auth-service";
import { createSession, deleteSession, getUserBySessionToken } from "@/server/auth/session";
import { hashToken } from "@/server/auth/tokens";
import { resetDb } from "../helpers/test-db";

const good = { email: "Kim@Example.test", name: "김지원", password: "Secure1234pw" };

describe("회원가입", () => {
  beforeEach(resetDb);

  it("이메일을 소문자로 정규화하고 비밀번호는 해시로 저장한다", async () => {
    const u = await signup(good);
    expect(u.email).toBe("kim@example.test");
    const row = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(row.passwordHash).not.toContain(good.password);
    expect(row.platformRole).toBe("USER");
  });

  it("중복 이메일은 거부한다", async () => {
    await signup(good);
    await expect(signup({ ...good, email: "kim@example.test" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it.each([
    ["짧은 비밀번호", "abc123"],
    ["숫자 없음", "abcdefghijk"],
    ["영문 없음", "12345678901"],
  ])("비밀번호 정책 위반(%s)을 거부한다", async (_, password) => {
    await expect(signup({ ...good, password })).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("가입 입력으로 플랫폼 권한을 올릴 수 없다", async () => {
    const u = await signup({ ...good, platformRole: "SUPER_ADMIN" });
    const row = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(row.platformRole).toBe("USER");
  });
});

describe("로그인", () => {
  beforeEach(resetDb);

  it("올바른 자격 증명으로 로그인한다", async () => {
    await signup(good);
    const u = await authenticate({ email: "KIM@example.test", password: good.password });
    expect(u.email).toBe("kim@example.test");
  });

  it("틀린 비밀번호와 없는 계정은 같은 메시지로 거부한다", async () => {
    await signup(good);
    const e1 = await authenticate({ email: good.email, password: "wrong-pass-1" }).catch((e) => e);
    const e2 = await authenticate({ email: "nobody@example.test", password: "wrong-pass-1" }).catch((e) => e);
    expect(e1.code).toBe("UNAUTHORIZED");
    expect(e1.message).toBe(e2.message);
  });

  it("같은 이메일로 5회 넘게 시도하면 차단한다(올바른 비밀번호여도)", async () => {
    await signup(good);
    for (let i = 0; i < 5; i++) {
      await authenticate({ email: good.email, password: "wrong-pass-1" }).catch(() => {});
    }
    await expect(authenticate({ email: good.email, password: good.password })).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});

describe("세션", () => {
  beforeEach(resetDb);

  it("토큰 원문은 DB 에 저장하지 않는다", async () => {
    const u = await signup(good);
    const { token } = await createSession(u.id);
    const rows = await prisma.session.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toBe(hashToken(token));
    expect(rows[0].tokenHash).not.toBe(token);
  });

  it("유효한 토큰으로 사용자를 찾고, 위조·빈 토큰은 거부한다", async () => {
    const u = await signup(good);
    const { token } = await createSession(u.id);
    expect((await getUserBySessionToken(token))?.id).toBe(u.id);
    expect(await getUserBySessionToken(token + "x")).toBeNull();
    expect(await getUserBySessionToken("")).toBeNull();
    expect(await getUserBySessionToken(undefined)).toBeNull();
  });

  it("만료된 세션은 거부하고 삭제한다", async () => {
    const u = await signup(good);
    const { token } = await createSession(u.id);
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await getUserBySessionToken(token)).toBeNull();
    expect(await prisma.session.count()).toBe(0);
  });

  it("로그아웃하면 세션이 폐기된다", async () => {
    const u = await signup(good);
    const { token } = await createSession(u.id);
    await deleteSession(token);
    expect(await getUserBySessionToken(token)).toBeNull();
  });
});
