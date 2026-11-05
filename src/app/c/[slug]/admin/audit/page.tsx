import { requireCompanyPermission } from "@/server/auth/current";
import { listAuditLogs } from "@/server/services/audit-service";
import { Card, Empty, PageHeader, Table, Td, formatDate } from "@/components/ui";

export default async function AuditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { ctx } = await requireCompanyPermission(slug, "audit:view");
  const logs = await listAuditLogs(ctx);

  return (
    <div>
      <PageHeader title="감사 로그" description="권한 변경, 승인, 초대 등 주요 작업 기록입니다(최근 200건)." />
      <Card>
        {logs.length === 0 ? (
          <Empty>기록이 없습니다.</Empty>
        ) : (
          <Table head={["시각", "작업자", "작업", "대상"]}>
            {logs.map((l) => (
              <tr key={l.id}>
                <Td className="whitespace-nowrap">{formatDate(l.createdAt)}</Td>
                <Td>{l.actorName}</Td>
                <Td>
                  <code className="text-xs">{l.action}</code>
                </Td>
                <Td className="text-xs text-slate-500">
                  {l.targetType} · {l.targetId}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
