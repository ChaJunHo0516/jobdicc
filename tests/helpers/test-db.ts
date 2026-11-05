import { prisma } from "@/server/db";
import { resetRateLimit } from "@/server/auth/rate-limit";

export async function resetDb() {
  resetRateLimit();
  await prisma.auditLog.deleteMany();
  await prisma.company.deleteMany(); // 회사 소속 데이터는 cascade 로 함께 삭제
  await prisma.user.deleteMany();
}
