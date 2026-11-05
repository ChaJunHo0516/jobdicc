"use server";

import { revalidatePath } from "next/cache";
import { createInvite, redeemInvite, revokeInvite } from "@/server/services/invite-service";
import { formToObject, handle, type ActionState } from "./helpers";
import { mustCompany, mustUser } from "./context";

export async function redeemInviteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    const user = await mustUser();
    const { company } = await redeemInvite(user, fd.get("code"));
    revalidatePath("/me");
    return { success: `${company.name}의 구성원으로 등록되었습니다. 학습공간에 입장할 수 있습니다.` };
  });
}

export async function createInviteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    const ctx = await mustCompany(fd);
    const { code } = await createInvite(ctx, formToObject(fd));
    revalidatePath(`/c/${ctx.companySlug}/admin/invites`);
    return { success: "초대 코드를 발급했습니다.", secret: code };
  });
}

export async function revokeInviteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return handle(async () => {
    const ctx = await mustCompany(fd);
    await revokeInvite(ctx, String(fd.get("inviteId") ?? ""));
    revalidatePath(`/c/${ctx.companySlug}/admin/invites`);
    return { success: "초대를 취소했습니다." };
  });
}
