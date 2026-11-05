import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getUserBySessionToken, SESSION_COOKIE, type SessionUser } from "./session";
import { resolveTenantContext, type TenantContext } from "../authz/context";
import { can, type Action } from "../authz/policy";
import { isAppError } from "@/lib/errors";
import { notFound as nextNotFound } from "next/navigation";

/** 요청 쿠키의 세션으로 현재 사용자를 찾는다(요청당 1회 캐시). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  return getUserBySessionToken(store.get(SESSION_COOKIE)?.value);
});

/** 페이지용: 비로그인 시 로그인 페이지로 이동 */
export async function requireUserPage(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

const cachedTenantContext = cache((userId: string, slug: string) => resolveTenantContext(userId, slug));

/** 페이지용: 회사 소속이 아니면 404 페이지 */
export async function requireCompanyPage(slug: string): Promise<{ user: SessionUser; ctx: TenantContext }> {
  const user = await requireUserPage();
  try {
    const ctx = await cachedTenantContext(user.id, slug);
    return { user, ctx };
  } catch (e) {
    if (isAppError(e) && e.code === "NOT_FOUND") nextNotFound();
    throw e;
  }
}

/** 페이지용: 회사 소속 + 특정 권한이 필요. 권한이 없으면 404 페이지(관리 화면의 존재를 드러내지 않음) */
export async function requireCompanyPermission(slug: string, action: Action) {
  const r = await requireCompanyPage(slug);
  if (!can(r.ctx, action)) nextNotFound();
  return r;
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function getClientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
