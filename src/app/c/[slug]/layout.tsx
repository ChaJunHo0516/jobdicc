import { SiteHeader } from "@/components/site-header";
import { CompanyNav } from "@/components/company-nav";
import { requireCompanyPage } from "@/server/auth/current";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { ctx } = await requireCompanyPage(slug);
  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <aside className="md:w-56 md:shrink-0">
          <CompanyNav ctx={ctx} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
