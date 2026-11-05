import { z } from "zod";

const optionalId = z
  .string()
  .trim()
  .max(40)
  .optional()
  .transform((v) => (v ? v : null));

export const departmentSchema = z.object({
  name: z.string().trim().min(1, "부서명을 입력하세요.").max(40),
});

export const positionLevelSchema = z.object({
  name: z.string().trim().min(1, "직급명을 입력하세요.").max(40),
  rank: z.coerce.number().int().min(1, "서열은 1 이상이어야 합니다.").max(100),
});

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("올바른 이메일 형식이 아닙니다."),
  role: z.enum(["PRE_HIRE", "EMPLOYEE", "TRAINER"], { message: "초대할 수 있는 역할이 아닙니다." }),
  departmentId: optionalId,
  positionLevelId: optionalId,
  expiresInDays: z.coerce.number().int().min(1).max(30).default(14),
  applicationId: optionalId,
});

export const memberUpdateSchema = z.object({
  membershipId: z.string().min(1),
  role: z.enum(["COMPANY_ADMIN", "TRAINER", "EMPLOYEE", "PRE_HIRE"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]),
  departmentId: optionalId,
  positionLevelId: optionalId,
});
