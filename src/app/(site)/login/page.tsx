import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Button, Card, Field, Input } from "@/components/ui";
import { getCurrentUser } from "@/server/auth/current";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/me");
  return (
    <div className="mx-auto max-w-md">
      <Card title="로그인">
        <ActionForm action={loginAction} className="space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <Field label="이메일">
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="비밀번호">
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>
          <Button type="submit" className="w-full">
            로그인
          </Button>
        </ActionForm>
        <p className="mt-4 text-center text-sm text-slate-600">
          계정이 없나요?{" "}
          <Link href="/signup" className="text-indigo-700 hover:underline">
            회원가입
          </Link>
        </p>
      </Card>
    </div>
  );
}
