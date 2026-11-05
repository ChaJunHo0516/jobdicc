"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionState } from "@/actions/helpers";
import { cx } from "./ui";

type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  /** 확인 대화상자 문구(위험한 작업용) */
  confirm?: string;
  encType?: "multipart/form-data";
};

/** Server Action 결과(오류/성공/1회성 비밀값)를 표시하는 폼 */
export function ActionForm({ action, children, className, resetOnSuccess, confirm: confirmMsg }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.success) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirmMsg && !window.confirm(confirmMsg)) e.preventDefault();
      }}
    >
      <fieldset disabled={pending} className={cx("contents", pending && "opacity-70")}>
        {children}
      </fieldset>
      {state?.error && (
        <p role="alert" className="mt-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="mt-2 text-sm text-emerald-700">
          {state.success}
        </p>
      )}
      {state?.secret && (
        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-900">이 값은 지금 한 번만 표시됩니다. 안전하게 전달하세요.</p>
          <code data-testid="secret-value" className="mt-1 block select-all text-lg font-bold tracking-wider text-slate-900">
            {state.secret}
          </code>
        </div>
      )}
    </form>
  );
}
