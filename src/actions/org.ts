"use server";

import { revalidatePath } from "next/cache";
import { createDepartment, createPositionLevel, deleteDepartment, deletePositionLevel } from "@/server/services/org-service";
import { updateMember } from "@/server/services/member-service";
import { formToObject, handle, type ActionState } from "./helpers";
import { mustCompany } from "./context";

export async function createDepartmentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    const ctx = await mustCompany(fd);
    await createDepartment(ctx, formToObject(fd));
    revalidatePath(`/c/${ctx.companySlug}/admin/org`);
    return { success: "부서를 추가했습니다." };
  });
}

export async function deleteDepartmentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    const ctx = await mustCompany(fd);
    await deleteDepartment(ctx, String(fd.get("id") ?? ""));
    revalidatePath(`/c/${ctx.companySlug}/admin/org`);
    return { success: "삭제했습니다." };
  });
}

export async function createPositionLevelAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    const ctx = await mustCompany(fd);
    await createPositionLevel(ctx, formToObject(fd));
    revalidatePath(`/c/${ctx.companySlug}/admin/org`);
    return { success: "직급을 추가했습니다." };
  });
}

export async function deletePositionLevelAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    const ctx = await mustCompany(fd);
    await deletePositionLevel(ctx, String(fd.get("id") ?? ""));
    revalidatePath(`/c/${ctx.companySlug}/admin/org`);
    return { success: "삭제했습니다." };
  });
}

export async function updateMemberAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    const ctx = await mustCompany(fd);
    await updateMember(ctx, formToObject(fd));
    revalidatePath(`/c/${ctx.companySlug}/admin/members`);
    return { success: "구성원 정보를 변경했습니다." };
  });
}
