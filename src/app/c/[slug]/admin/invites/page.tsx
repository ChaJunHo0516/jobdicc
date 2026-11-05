import { requireCompanyPermission } from "@/server/auth/current";
import { listInvites } from "@/server/services/invite-service";
import { listDepartments, listPositionLevels } from "@/server/services/org-service";
import { createInviteAction, revokeInviteAction } from "@/actions/invite";
import { ActionForm } from "@/components/action-form";
import { CompanyField, Hidden } from "@/components/hidden";
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select, Table, Td, formatDate } from "@/components/ui";
import { MEMBER_ROLE } from "@/lib/labels";

function inviteState(i: { usedAt: Date | null; revokedAt: Date | null; expiresAt: Date }) {
  if (i.usedAt) return <Badge tone="green">등록 완료</Badge>;
  if (i.revokedAt) return <Badge tone="gray">취소됨</Badge>;
  if (i.expiresAt.getTime() <= Date.now()) return <Badge tone="red">만료</Badge>;
  return <Badge tone="yellow">대기</Badge>;
}

export default async function InvitesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ email?: string; applicationId?: string }>;
}) {
  const { slug } = await params;
  const prefill = await searchParams;
  const { ctx } = await requireCompanyPermission(slug, "invite:manage");
  const [invites, departments, levels] = await Promise.all([listInvites(ctx), listDepartments(ctx), listPositionLevels(ctx)]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="합격자·직원 초대"
        description="초대 코드는 발급할 때 한 번만 표시됩니다. 코드는 지정한 이메일로 가입한 계정에서만 등록할 수 있습니다."
      />
      <Card title="초대 코드 발급">
        <ActionForm action={createInviteAction} className="grid gap-3 sm:grid-cols-2">
          <CompanyField slug={slug} />
          {prefill.applicationId && <Hidden name="applicationId" value={prefill.applicationId} />}
          <Field label="이메일">
            <Input name="email" type="email" required defaultValue={prefill.email ?? ""} />
          </Field>
          <Field label="역할">
            <Select name="role" defaultValue="PRE_HIRE">
              {(["PRE_HIRE", "EMPLOYEE", "TRAINER"] as const).map((r) => (
                <option key={r} value={r}>
                  {MEMBER_ROLE[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="부서">
            <Select name="departmentId" defaultValue="">
              <option value="">지정 안 함</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="직급">
            <Select name="positionLevelId" defaultValue="">
              <option value="">지정 안 함</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="유효 기간(일)">
            <Input name="expiresInDays" type="number" min={1} max={30} defaultValue={14} />
          </Field>
          <div className="flex items-end">
            <Button type="submit">발급</Button>
          </div>
        </ActionForm>
      </Card>

      <Card title="발급 내역">
        {invites.length === 0 ? (
          <Empty>발급한 초대가 없습니다.</Empty>
        ) : (
          <Table head={["이메일", "역할", "부서·직급", "만료", "상태", ""]}>
            {invites.map((i) => (
              <tr key={i.id}>
                <Td>{i.email}</Td>
                <Td>{MEMBER_ROLE[i.role]}</Td>
                <Td>{[i.department?.name, i.positionLevel?.name].filter(Boolean).join(" · ") || "-"}</Td>
                <Td>{formatDate(i.expiresAt)}</Td>
                <Td>{inviteState(i)}</Td>
                <Td>
                  {!i.usedAt && !i.revokedAt && (
                    <ActionForm action={revokeInviteAction} confirm="이 초대를 취소할까요?">
                      <CompanyField slug={slug} />
                      <Hidden name="inviteId" value={i.id} />
                      <Button type="submit" variant="ghost" className="px-2 py-1 text-xs text-rose-600">
                        취소
                      </Button>
                    </ActionForm>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
