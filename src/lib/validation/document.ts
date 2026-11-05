import { z } from "zod";

export const documentMetaSchema = z.object({
  title: z.string().trim().min(2, "제목은 2자 이상이어야 합니다.").max(120),
  description: z.string().trim().max(1000).default(""),
  /** 체크하면 '모든 구성원' 접근 규칙을 함께 만든다 */
  allMembers: z
    .union([z.literal("on"), z.literal("true"), z.literal(""), z.undefined()])
    .transform((v) => v === "on" || v === "true"),
});

const optionalInt = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((v) => (v === "" || v == null ? null : Number(v)))
  .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 100), "직급 서열은 1~100 사이 정수여야 합니다.");

export const accessRuleSchema = z
  .object({
    departmentId: z
      .string()
      .trim()
      .max(40)
      .optional()
      .transform((v) => (v ? v : null)),
    minRank: optionalInt,
    maxRank: optionalInt,
    roles: z.array(z.enum(["COMPANY_ADMIN", "TRAINER", "EMPLOYEE", "PRE_HIRE"])).default([]),
  })
  .refine((r) => r.minRank == null || r.maxRank == null || r.minRank <= r.maxRank, "최소 서열이 최대 서열보다 클 수 없습니다.");

export const reviewSchema = z
  .object({
    decision: z.enum(["approve", "reject"]),
    reason: z.string().trim().max(500).default(""),
  })
  .refine((r) => r.decision === "approve" || r.reason.length > 0, "반려 사유를 입력하세요.");

export const quizCountSchema = z.coerce.number().int().min(1).max(10).default(5);
