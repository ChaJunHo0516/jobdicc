import { requireCompanyPermission } from "@/server/auth/current";
import { listMembers } from "@/server/services/member-service";
import { listDepartments, listPositionLevels } from "@/server/services/org-service";
import { updateMemberAction } from "@/actions/org";
import { ActionForm } from "@/components/action-form";
import { CompanyField, Hidden } from "@/components/hidden";
import { Badge, Button, Card, PageHeader, Select } from "@/components/ui";
import { MEMBER_ROLE, MEMBER_STATUS } from "@/lib/labels";

export default async function MembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { ctx } = await requireCompanyPermission(slug, "member:manage");
  const [members, departments, levels] = await Promise.all([listMembers(ctx), listDepartments(ctx), listPositionLevels(ctx)]);

  return (
    <div>
      <PageHeader
        title="구성원·권한"
        description="역할, 상태, 부서, 직급을 변경합니다. 합격자가 입사하면 역할을 '직원'으로 바꾸세요."
      />
      <Card>
        <ul className="divide-y divide-slate-100">
          {members.map((m) => {
            const [statusLabel, tone] = MEMBER_STATUS[m.status];
            return (
              <li key={m.id} className="py-4" data-testid={`member-${m.user.email}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-medium">{m.user.name}</span>
                  <span className="text-sm text-slate-500">{m.user.email}</span>
                  <Badge tone={tone}>{statusLabel}</Badge>
                  {m.userId === ctx.userId && <Badge tone="blue">나</Badge>}
                </div>
                <ActionForm action={updateMemberAction} className="grid gap-2 sm:grid-cols-5">
                  <CompanyField slug={slug} />
                  <Hidden name="membershipId" value={m.id} />
                  <Select name="role" defaultValue={m.role} aria-label="역할">
                    {Object.entries(MEMBER_ROLE).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                  <Select name="status" defaultValue={m.status} aria-label="상태">
                    {Object.entries(MEMBER_STATUS).map(([v, [l]]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                  <Select name="departmentId" defaultValue={m.departmentId ?? ""} aria-label="부서">
                    <option value="">부서 없음</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                  <Select name="positionLevelId" defaultValue={m.positionLevelId ?? ""} aria-label="직급">
                    <option value="">직급 없음</option>
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" variant="secondary">
                    저장
                  </Button>
                </ActionForm>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
