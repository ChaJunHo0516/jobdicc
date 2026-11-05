import { prisma } from "../db";
import { tenantDb } from "../tenant-db";
import { authorize, can } from "../authz/policy";
import type { TenantContext } from "../authz/context";
import { canLearn } from "../authz/document-access";
import { validateUpload } from "../storage/file-validation";
import { deleteFile, loadFile, saveFile } from "../storage/local-storage";
import { extractText } from "../ai/text-extract";
import { forbidden, invalid, notFound } from "@/lib/errors";
import { parseInput } from "@/lib/validation/parse";
import { accessRuleSchema, documentMetaSchema, reviewSchema } from "@/lib/validation/document";
import { assertOrgRefs } from "./org-service";
import { writeAudit } from "./audit-service";

export type UploadInput = { meta: unknown; fileName: string; bytes: Uint8Array };

/** 교육자료 업로드. 승인 전(PENDING_APPROVAL)에는 학습자에게 보이지 않는다. */
export async function uploadDocument(ctx: TenantContext, input: UploadInput) {
  authorize(ctx, "document:upload");
  const meta = parseInput(documentMetaSchema, input.meta);
  const file = validateUpload(input.fileName, input.bytes);
  const extractedText = await extractText(input.bytes, file.ext);
  const fileKey = await saveFile(ctx.companyId, input.bytes, file.ext);

  try {
    const doc = await tenantDb(ctx.companyId).$transaction(async (tx) => {
      const d = await tx.document.create({
        data: {
          companyId: ctx.companyId,
          title: meta.title,
          description: meta.description,
          fileKey,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          extractedText,
          uploadedById: ctx.userId,
        },
      });
      if (meta.allMembers) {
        await tx.documentAccessRule.create({ data: { companyId: ctx.companyId, documentId: d.id } });
      }
      return d;
    });
    await writeAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "document.upload", targetType: "Document", targetId: doc.id });
    return doc;
  } catch (e) {
    await deleteFile(ctx.companyId, fileKey).catch(() => {});
    throw e;
  }
}

async function userNames(ids: string[]) {
  const users = await prisma.user.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, name: true } });
  return new Map(users.map((u) => [u.id, u.name]));
}

export async function listDocumentsForManage(ctx: TenantContext) {
  authorize(ctx, "document:viewAll");
  const docs = await tenantDb(ctx.companyId).document.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, status: true, createdAt: true, uploadedById: true, originalName: true, size: true,
      _count: { select: { accessRules: true, quizzes: true } },
      aiArtifacts: { where: { status: "PENDING_REVIEW" }, select: { id: true } },
    },
  });
  const names = await userNames(docs.map((d) => d.uploadedById));
  return docs.map((d) => ({ ...d, uploaderName: names.get(d.uploadedById) ?? "-", pendingAi: d.aiArtifacts.length }));
}

export async function getDocumentForManage(ctx: TenantContext, id: string) {
  authorize(ctx, "document:viewAll");
  const doc = await tenantDb(ctx.companyId).document.findUnique({
    where: { id },
    include: {
      accessRules: { include: { department: { select: { name: true } } } },
      aiArtifacts: { orderBy: { createdAt: "desc" }, select: { id: true, type: true, status: true, provider: true, createdAt: true } },
      quizzes: { select: { id: true, title: true, _count: { select: { questions: true } } } },
    },
  });
  if (!doc) throw notFound();
  const names = await userNames([doc.uploadedById, ...(doc.reviewedById ? [doc.reviewedById] : [])]);
  return {
    ...doc,
    uploaderName: names.get(doc.uploadedById) ?? "-",
    reviewerName: doc.reviewedById ? (names.get(doc.reviewedById) ?? "-") : null,
  };
}

/**
 * 문서 승인·반려. 교육담당자는 본인이 올린 자료를 승인할 수 없다(이중 확인).
 * 회사 관리자의 자기 승인은 허용하되 감사 로그에 남는다.
 */
export async function reviewDocument(ctx: TenantContext, id: string, raw: unknown) {
  authorize(ctx, "document:review");
  const input = parseInput(reviewSchema, raw);
  const db = tenantDb(ctx.companyId);
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) throw notFound();
  if (doc.status !== "PENDING_APPROVAL") throw invalid("승인 대기 중인 문서만 검토할 수 있습니다.");
  const selfReview = doc.uploadedById === ctx.userId;
  if (selfReview && input.decision === "approve" && ctx.role !== "COMPANY_ADMIN") {
    throw forbidden("본인이 올린 자료는 다른 담당자가 승인해야 합니다.");
  }
  const approved = input.decision === "approve";
  await db.document.update({
    where: { id },
    data: {
      status: approved ? "APPROVED" : "REJECTED",
      reviewedById: ctx.userId,
      reviewedAt: new Date(),
      rejectReason: approved ? null : input.reason,
    },
  });
  await writeAudit({
    companyId: ctx.companyId,
    actorId: ctx.userId,
    action: approved ? "document.approve" : "document.reject",
    targetType: "Document",
    targetId: id,
    metadata: { selfReview, reason: input.reason || undefined },
  });
}

export async function archiveDocument(ctx: TenantContext, id: string) {
  authorize(ctx, "document:review");
  const r = await tenantDb(ctx.companyId).document.updateMany({ where: { id, status: { not: "ARCHIVED" } }, data: { status: "ARCHIVED" } });
  if (r.count === 0) throw notFound();
  await writeAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "document.archive", targetType: "Document", targetId: id });
}

export async function addAccessRule(ctx: TenantContext, documentId: string, raw: unknown) {
  authorize(ctx, "document:review");
  const input = parseInput(accessRuleSchema, raw);
  const db = tenantDb(ctx.companyId);
  if (!(await db.document.findUnique({ where: { id: documentId } }))) throw notFound();
  await assertOrgRefs(ctx, { departmentId: input.departmentId });
  const rule = await db.documentAccessRule.create({
    data: {
      companyId: ctx.companyId,
      documentId,
      departmentId: input.departmentId,
      minRank: input.minRank,
      maxRank: input.maxRank,
      roles: input.roles.join(","),
    },
  });
  await writeAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "document.rule.add", targetType: "Document", targetId: documentId, metadata: { ruleId: rule.id } });
  return rule;
}

export async function deleteAccessRule(ctx: TenantContext, ruleId: string) {
  authorize(ctx, "document:review");
  const db = tenantDb(ctx.companyId);
  const rule = await db.documentAccessRule.findUnique({ where: { id: ruleId } });
  if (!rule) throw notFound();
  await db.documentAccessRule.delete({ where: { id: ruleId } });
  await writeAudit({ companyId: ctx.companyId, actorId: ctx.userId, action: "document.rule.delete", targetType: "Document", targetId: rule.documentId, metadata: { ruleId } });
}

/** 학습 화면용 문서 목록: 열람 가능한 승인 문서 + 내 진도 */
export async function listLearnerDocuments(ctx: TenantContext) {
  authorize(ctx, "learning:access");
  const db = tenantDb(ctx.companyId);
  const docs = await db.document.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, description: true, status: true, createdAt: true,
      accessRules: true,
      _count: { select: { quizzes: true } },
    },
  });
  const visible = docs.filter((d) => canLearn(ctx, d, d.accessRules));
  const progress = await db.learningProgress.findMany({ where: { userId: ctx.userId, documentId: { in: visible.map((d) => d.id) } } });
  const byDoc = new Map(progress.map((p) => [p.documentId, p]));
  return visible.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    createdAt: d.createdAt,
    quizCount: d._count.quizzes,
    progress: byDoc.get(d.id) ?? null,
  }));
}

/** 학습 화면용 문서 상세. 볼 수 없는 문서는 존재 여부를 숨기기 위해 404. */
export async function getLearnerDocument(ctx: TenantContext, id: string) {
  const db = tenantDb(ctx.companyId);
  const doc = await db.document.findUnique({ where: { id }, include: { accessRules: true } });
  if (!doc || !canLearn(ctx, doc, doc.accessRules)) throw notFound();

  const [summary, quizzes] = await Promise.all([
    // 학습자에게는 '승인된' AI 요약만 노출한다.
    db.aiArtifact.findFirst({
      where: { documentId: id, type: "SUMMARY", status: "APPROVED" },
      orderBy: { reviewedAt: "desc" },
      select: { content: true, reviewedAt: true, reviewedById: true, provider: true },
    }),
    db.quiz.findMany({ where: { documentId: id }, select: { id: true, title: true, passScore: true, _count: { select: { questions: true } } } }),
  ]);
  const reviewer = summary?.reviewedById ? await prisma.user.findUnique({ where: { id: summary.reviewedById }, select: { name: true } }) : null;

  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    extractedText: doc.extractedText,
    summary: summary ? { ...(JSON.parse(summary.content) as { summary: string; keyPoints: string[] }), reviewedAt: summary.reviewedAt, reviewerName: reviewer?.name ?? "-", provider: summary.provider } : null,
    quizzes,
  };
}

/**
 * 원본 파일 다운로드. 관리 권한자는 검토를 위해 승인 전 문서도 받을 수 있고,
 * 학습자는 열람 가능한 승인 문서만 받을 수 있다.
 */
export async function getDocumentFile(ctx: TenantContext, id: string) {
  const doc = await tenantDb(ctx.companyId).document.findUnique({ where: { id }, include: { accessRules: true } });
  if (!doc) throw notFound();
  const allowed = can(ctx, "document:viewAll") || canLearn(ctx, doc, doc.accessRules);
  if (!allowed) throw notFound();
  const bytes = await loadFile(ctx.companyId, doc.fileKey);
  return { bytes, mimeType: doc.mimeType, originalName: doc.originalName };
}
