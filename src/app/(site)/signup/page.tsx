import Link from "next/link";
import { redirect } from "next/navigation";
import { signupAction } from "@/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Button, Card, Field, Input } from "@/components/ui";
import { getCurrentUser } from "@/server/auth/current";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/me");
  return (
    <div className="mx-auto max-w-md">
      <Card title="개인 회원가입">
        <ActionForm action={signupAction} className="space-y-4">
          <Field label="이름">
            <Input name="name" autoComplete="name" required maxLength={50} />
          </Field>
          <Field label="이메일" hint="합격자 초대 코드는 이 이메일로 발급된 경우에만 등록할 수 있습니다.">
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="비밀번호" hint="10자 이상, 영문과 숫자를 모두 포함해야 합니다.">
            <Input name="password" type="password" autoComplete="new-password" required minLength={10} />
          </Field>
          <Button type="submit" className="w-full">
            가입하기
          </Button>
        </ActionForm>
        <p className="mt-4 text-center text-sm text-slate-600">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="text-indigo-700 hover:underline">
            로그인
          </Link>
        </p>
      </Card>
    </div>
  );
}
