import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router-dom";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title }: { children: ReactNode; className?: string; title?: ReactNode }) {
  return (
    <section className={cx("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {title && <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>}
      {children}
    </section>
  );
}

const btn = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  ghost: "text-slate-700 hover:bg-slate-100",
};
type Variant = keyof typeof btn;
const btnBase =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

export function Button({ variant = "primary", className, ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" {...p} className={cx(btnBase, btn[variant], className)} />;
}

export function LinkButton({ variant = "primary", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...p} className={cx(btnBase, btn[variant], className)} />;
}

const inputCls =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  );
}

export const Input = (p: ComponentProps<"input">) => <input {...p} className={cx(inputCls, p.className)} />;
export const Textarea = (p: ComponentProps<"textarea">) => <textarea {...p} className={cx(inputCls, p.className)} />;
export const Select = (p: ComponentProps<"select">) => <select {...p} className={cx(inputCls, p.className)} />;

const tones = {
  gray: "bg-slate-100 text-slate-700",
  green: "bg-emerald-100 text-emerald-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-rose-100 text-rose-800",
  blue: "bg-indigo-100 text-indigo-800",
};
export type Tone = keyof typeof tones;

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{children}</p>;
}

export function Notice({ tone = "blue", children }: { tone?: "blue" | "yellow" | "red" | "green"; children: ReactNode }) {
  const c = {
    blue: "border-indigo-200 bg-indigo-50 text-indigo-900",
    yellow: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-rose-200 bg-rose-50 text-rose-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[tone];
  return <div role="status" className={cx("rounded-lg border p-3 text-sm", c)}>{children}</div>;
}

/** 모의 동작임을 표시하는 작은 표식 */
export function MockTag({ children = "모의 동작" }: { children?: ReactNode }) {
  return <span className="ml-1 rounded border border-dashed border-amber-400 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">{children}</span>;
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
