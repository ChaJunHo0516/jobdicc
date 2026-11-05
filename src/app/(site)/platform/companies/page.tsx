import { notFound } from "next/navigation";
import { requireUserPage } from "@/server/auth/current";
import { listCompaniesForPlatform } from "@/server/services/company-service";
import { setCompanyStatusAction } from "@/actions/company";
import { ActionForm } from "@/components/action-form";
import { Badge, Button, Card, Empty, PageHeader, Table, Td, formatDate } from "@/components/ui";
import { COMPANY_STATUS } from "@/lib/labels";

function StatusButton(props: { companyId: string; status: string; label: string; variant?: "primary" | "danger" | "secondary" }) {
  return (
    <ActionForm action={setCompanyStatusAction}>
      <input type="hidden" name="companyId" value={props.companyId} />
      <input type="hidden" name="status" value={props.status} />
      <Button type="submit" variant={props.variant} className="px-3 py-1 text-xs">
        {props.label}
      </Button>
    </ActionForm>
  );
}

export default async function PlatformCompanies() {
  const user = await requireUserPage();
  if (user.platformRole !== "SUPER_ADMIN") notFound();
  const companies = await listCompaniesForPlatform(user);

  return (
    <div>
      <PageHeader
        title="회사 개설 승인"
        description="플랫폼 관리자는 회사 승인만 할 수 있으며, 회사 내부 자료는 볼 수 없습니다."
      />
      <Card>
        {companies.length === 0 ? (
          <Empty>등록된 회사가 없습니다.</Empty>
        ) : (
          <Table head={["회사", "신청자", "신청일", "상태", "처리"]}>
            {companies.map((c) => {
              const [label, tone] = COMPANY_STATUS[c.status];
              return (
                <tr key={c.id}>
                  <Td>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-slate-500">/c/{c.slug}</p>
                  </Td>
                  <Td>
                    {c.createdBy.name}
                    <p className="text-xs text-slate-500">{c.createdBy.email}</p>
                  </Td>
                  <Td>{formatDate(c.createdAt)}</Td>
                  <Td>
                    <Badge tone={tone}>{label}</Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      {c.status === "PENDING" && (
                        <>
                          <StatusButton companyId={c.id} status="ACTIVE" label="승인" />
                          <StatusButton companyId={c.id} status="REJECTED" label="반려" variant="danger" />
                        </>
                      )}
                      {c.status === "ACTIVE" && (
                        <StatusButton companyId={c.id} status="SUSPENDED" label="정지" variant="danger" />
                      )}
                      {c.status === "SUSPENDED" && (
                        <StatusButton companyId={c.id} status="ACTIVE" label="정지 해제" variant="secondary" />
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
}
