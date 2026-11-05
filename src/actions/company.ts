"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/server/auth/current";
import { requestCompany, setCompanyStatus } from "@/server/services/company-service";
import { unauthorized } from "@/lib/errors";
import { formToObject, handle, type ActionState } from "./helpers";

async function mustUser() {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requestCompanyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    const user = await mustUser();
    await requestCompany(user.id, formToObject(fd));
    revalidatePath("/me");
    return { success: "회사 개설을 신청했습니다. 플랫폼 관리자가 승인하면 학습공간이 열립니다." };
  });
}

export async function setCompanyStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    const user = await mustUser();
    const { companyId, status } = formToObject(fd);
    if (status !== "ACTIVE" && status !== "REJECTED" && status !== "SUSPENDED") return { error: "잘못된 요청입니다." };
    await setCompanyStatus(user, companyId, status);
    revalidatePath("/platform/companies");
    return { success: "상태를 변경했습니다." };
  });
}
