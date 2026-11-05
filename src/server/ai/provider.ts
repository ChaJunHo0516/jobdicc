import { z } from "zod";

/** AI 요약 결과. 승인 전에는 학습자에게 공개하지 않는다. */
export const summarySchema = z.object({
  summary: z.string().trim().min(10, "요약이 너무 짧습니다.").max(3000),
  keyPoints: z.array(z.string().trim().min(2).max(300)).min(1).max(10),
});

export const quizQuestionSchema = z.object({
  prompt: z.string().trim().min(5, "문항이 너무 짧습니다.").max(500),
  options: z.array(z.string().trim().min(1, "보기를 입력하세요.").max(200)).length(4, "보기는 4개여야 합니다."),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().max(500).default(""),
});

export const quizSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1, "문항이 1개 이상 필요합니다.").max(10),
});

export type SummaryContent = z.infer<typeof summarySchema>;
export type QuizContent = z.infer<typeof quizSchema>;

export type GenerateInput = { title: string; text: string };

export interface AiProvider {
  /** 결과에 기록되는 공급자 식별자 (예: "mock", "claude") */
  readonly name: string;
  readonly model: string;
  summarize(input: GenerateInput): Promise<SummaryContent>;
  generateQuiz(input: GenerateInput & { count: number }): Promise<QuizContent>;
}

/** 원문을 잘라내지 않는다. 너무 긴 문서는 나눠 올리도록 안내한다. */
export const MAX_AI_INPUT_CHARS = 150_000;
