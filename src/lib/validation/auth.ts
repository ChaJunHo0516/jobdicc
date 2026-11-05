import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("올바른 이메일 형식이 아닙니다.")
  .max(254);

export const passwordSchema = z
  .string()
  .min(10, "비밀번호는 10자 이상이어야 합니다.")
  .max(128, "비밀번호는 128자 이하여야 합니다.")
  .regex(/[A-Za-z]/, "비밀번호에 영문자가 포함되어야 합니다.")
  .regex(/[0-9]/, "비밀번호에 숫자가 포함되어야 합니다.");

export const signupSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(1, "이름을 입력하세요.").max(50),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "비밀번호를 입력하세요.").max(128),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
