import { requireCompanyPermission } from "@/server/auth/current";
import { listDepartments, listPositionLevels } from "@/server/services/org-service";
import {
  createDepartmentAction,
  createPositionLevelAction,
  deleteDepartmentAction,
  deletePositionLevelAction,
} from "@/actions/org";
import { ActionForm } from "@/components/action-form";
import { CompanyField, Hidden } from "@/components/hidden";
import { Button, Card, Empty, Field, Input, PageHeader } from "@/components/ui";

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { ctx } = await requireCompanyPermission(slug, "org:manage");
  const [departments, levels] = await Promise.all([listDepartments(ctx), listPositionLevels(ctx)]);

  return (
    <div>
      <PageHeader title="부서·직급" description="문서 접근 규칙과 초대에 사용됩니다. 직급 서열(rank)은 숫자가 클수록 상위 직급입니다." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="부서">
          <ActionForm action={createDepartmentAction} className="mb-4 flex items-end gap-2" resetOnSuccess>
            <CompanyField slug={slug} />
            <div className="flex-1">
              <Field label="새 부서명">
                <Input name="name" required maxLength={40} />
              </Field>
            </div>
            <Button type="submit">추가</Button>
          </ActionForm>
          {departments.length === 0 ? (
            <Empty>부서가 없습니다.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {departments.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2">
                  <span>{d.name}</span>
                  <ActionForm action={deleteDepartmentAction} confirm={`${d.name} 부서를 삭제할까요? 관련 접근 규칙도 삭제됩니다.`}>
                    <CompanyField slug={slug} />
                    <Hidden name="id" value={d.id} />
                    <Button type="submit" variant="ghost" className="px-2 py-1 text-xs text-rose-600">
                      삭제
                    </Button>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="직급">
          <ActionForm action={createPositionLevelAction} className="mb-4 flex items-end gap-2" resetOnSuccess>
            <CompanyField slug={slug} />
            <div className="flex-1">
              <Field label="직급명">
                <Input name="name" required maxLength={40} />
              </Field>
            </div>
            <div className="w-24">
              <Field label="서열">
                <Input name="rank" type="number" min={1} max={100} required />
              </Field>
            </div>
            <Button type="submit">추가</Button>
          </ActionForm>
          {levels.length === 0 ? (
            <Empty>직급이 없습니다.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {levels.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2">
                  <span>
                    {l.name} <span className="text-xs text-slate-500">(서열 {l.rank})</span>
                  </span>
                  <ActionForm action={deletePositionLevelAction} confirm={`${l.name} 직급을 삭제할까요?`}>
                    <CompanyField slug={slug} />
                    <Hidden name="id" value={l.id} />
                    <Button type="submit" variant="ghost" className="px-2 py-1 text-xs text-rose-600">
                      삭제
                    </Button>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
