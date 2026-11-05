import Link from "next/link";
import { requireUserPage } from "@/server/auth/current";
import { listMyCompanies } from "@/server/services/company-service";
import { requestCompanyAction } from "@/actions/company";
import { redeemInviteAction } from "@/actions/invite";
import { ActionForm } from "@/components/action-form";
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { COMPANY_STATUS, MEMBER_ROLE } from "@/lib/labels";

export default async function MyDashboard() {
  const user = await requireUserPage();
  const companies = await listMyCompanies(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user.name}님의 대시보드`}
        description="소속 회사의 학습공간으로 이동하거나, 합격자 초대 코드를 등록하세요."
      />

      <Card title="내 회사 학습공간">
        {companies.length === 0 ? (
          <Empty>아직 소속된 회사가 없습니다. 합격 후 받은 초대 코드를 아래에서 등록하세요.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {companies.map(({ company, role, department, positionLevel }) => {
              const [label, tone] = COMPANY_STATUS[company.status];
              return (
                <li key={company.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{company.name}</p>
                    <p className="text-sm text-slate-500">
                      {MEMBER_ROLE[role]}
                      {department && ` · ${department}`}
                      {positionLevel && ` · ${positionLevel}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={tone}>{label}</Badge>
                    {company.status === "ACTIVE" && (
                      <Link href={`/c/${company.slug}`} className="text-sm font-medium text-indigo-700 hover:underline">
                        입장 →
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="합격자·직원 초대 코드 등록">
          <ActionForm action={redeemInviteAction} className="space-y-3" resetOnSuccess>
            <p className="text-sm text-slate-600">
              회사에서 받은 코드를 입력하세요. 초대받은 이메일로 가입한 계정에서만 등록할 수 있습니다.
            </p>
            <Field label="초대 코드">
              <Input name="code" placeholder="XXXX-XXXX-XXXX" required maxLength={20} autoComplete="off" />
            </Field>
            <Button type="submit">등록하기</Button>
          </ActionForm>
        </Card>

        <Card title="회사 개설 신청">
          <p className="mb-3 text-sm text-slate-600">
            회사 담당자라면 회사 학습공간을 신청하세요. 플랫폼 관리자가 승인하면 신청자가 회사 관리자가 됩니다.
          </p>
          <ActionForm action={requestCompanyAction} className="space-y-3" resetOnSuccess>
            <Field label="회사명">
              <Input name="name" required maxLength={60} />
            </Field>
            <Field label="회사 주소(slug)" hint="영문 소문자·숫자·하이픈, 예: alpha-tech">
              <Input name="slug" required maxLength={30} />
            </Field>
            <Field label="소개">
              <Textarea name="description" rows={2} maxLength={500} />
            </Field>
            <Button type="submit">신청하기</Button>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
