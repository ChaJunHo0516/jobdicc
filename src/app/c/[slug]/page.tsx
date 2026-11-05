import { requireCompanyPage } from "@/server/auth/current";
import { Card, PageHeader } from "@/components/ui";
import { MEMBER_ROLE } from "@/lib/labels";

export default async function CompanyHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, ctx } = await requireCompanyPage(slug);
  return (
    <div>
      <PageHeader title={`${ctx.companyName} 학습공간`} description={`${user.name}님 · ${MEMBER_ROLE[ctx.role]}`} />
      <Card>
        <p className="text-sm text-slate-600">왼쪽 메뉴에서 학습자료와 관리 기능을 이용하세요.</p>
      </Card>
    </div>
  );
}
