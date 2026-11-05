import { getCurrentUser } from "@/server/auth/current";
import { resolveTenantContext } from "@/server/authz/context";
import { unauthorized } from "@/lib/errors";

export async function mustUser() {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

/** Server Action 용: 폼의 companySlug 와 세션으로 회사 컨텍스트를 서버에서 다시 검증한다. */
export async function mustCompany(fd: FormData) {
  const user = await mustUser();
  const slug = fd.get("companySlug");
  if (typeof slug !== "string" || !slug) throw unauthorized();
  return resolveTenantContext(user.id, slug);
}
