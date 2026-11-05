"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authenticate, signup } from "@/server/services/auth-service";
import { createSession, deleteSession } from "@/server/auth/session";
import { clearSessionCookie, getClientKey, getSessionToken, setSessionCookie } from "@/server/auth/current";
import { formToObject, handle, type ActionState } from "./helpers";

/** 로그인 후 이동할 경로는 내부 경로만 허용한다(오픈 리다이렉트 방지). */
function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/me";
}

async function startSession(userId: string) {
  const ua = (await headers()).get("user-agent");
  const { token, expiresAt } = await createSession(userId, ua);
  await setSessionCookie(token, expiresAt);
}

export async function signupAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const input = formToObject(fd);
  return handle(async () => {
    const user = await signup(input);
    await startSession(user.id);
    redirect(safeNext(input.next));
  });
}

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const input = formToObject(fd);
  return handle(async () => {
    const user = await authenticate(input, await getClientKey());
    await startSession(user.id);
    redirect(safeNext(input.next));
  });
}

export async function logoutAction() {
  await deleteSession(await getSessionToken());
  await clearSessionCookie();
  redirect("/login");
}
