import { z } from "zod";

export const companyRequestSchema = z.object({
  name: z.string().trim().min(2, "회사명은 2자 이상이어야 합니다.").max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "주소는 3자 이상이어야 합니다.")
    .max(30, "주소는 30자 이하여야 합니다.")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "주소는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다."),
  description: z.string().trim().max(500).default(""),
});

export const RESERVED_SLUGS = new Set(["admin", "api", "platform", "login", "signup", "jobs", "me", "new"]);
