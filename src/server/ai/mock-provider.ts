import { invalid } from "@/lib/errors";
import type { AiProvider, GenerateInput, QuizContent, SummaryContent } from "./provider";

/**
 * 외부 호출 없이 동작하는 개발·테스트용 AI 대체 구현.
 * 문서에서 핵심 문장과 반복 용어를 뽑는 규칙 기반 방식이며, 같은 입력에는 항상 같은 결과를 낸다.
 * 품질은 실제 AI 보다 낮으므로 결과는 반드시 담당자 검토를 거친다.
 */
export class MockAiProvider implements AiProvider {
  readonly name = "mock";
  readonly model = "mock-rule-based-v1";

  async summarize({ text }: GenerateInput): Promise<SummaryContent> {
    const { sentences, scored } = analyze(text);
    if (sentences.length === 0) throw invalid("요약할 수 있는 문장이 문서에 없습니다.");
    const top = scored.slice(0, 5).sort((a, b) => a.index - b.index);
    return {
      summary: top
        .slice(0, 3)
        .map((s) => s.text)
        .join(" "),
      keyPoints: top.map((s) => s.text),
    };
  }

  async generateQuiz({ text, count }: GenerateInput & { count: number }): Promise<QuizContent> {
    const { scored, terms } = analyze(text);
    const topTerms = terms.slice(0, 15);
    const used = new Set<string>();
    const questions: QuizContent["questions"] = [];

    for (const s of scored) {
      if (questions.length >= count) break;
      const term = topTerms.find((t) => !used.has(t) && s.text.includes(t));
      if (!term) continue;
      const distractors = topTerms.filter((t) => t !== term && !s.text.includes(t) && !t.includes(term) && !term.includes(t));
      if (distractors.length < 3) continue;
      used.add(term);

      const h = hash(s.text);
      const picked = [0, 1, 2].map((i) => distractors[(h + i * 7) % distractors.length]);
      if (new Set(picked).size < 3) picked.splice(0, 3, ...distractors.slice(0, 3));
      const answerIndex = h % 4;
      const options = [...picked];
      options.splice(answerIndex, 0, term);

      questions.push({
        prompt: `다음 문장의 빈칸에 들어갈 알맞은 말은?\n"${s.text.replace(term, "_____")}"`,
        options,
        answerIndex,
        explanation: `원문: "${s.text}"`,
      });
    }
    if (questions.length === 0) throw invalid("퀴즈를 만들기에 문서 내용이 부족합니다.");
    return { questions };
  }
}

const PARTICLE = /(으로|에서|에게|까지|부터|이다|입니다|합니다|하며|하고|해야|하는|된다|한다|은|는|이|가|을|를|에|의|와|과|로|도|만)$/;
const STOPWORDS = new Set([
  "있다", "없다", "한다", "합니다", "있습니다", "및", "등", "또는", "경우", "위해", "대한", "통해", "모든", "각", "해당",
  "있는", "없는", "이상", "이하", "다음", "그리고", "하지만", "또한", "the", "and", "for", "with", "this", "that",
]);

type Scored = { text: string; index: number; score: number };

function analyze(raw: string) {
  const sentences = raw
    .split(/(?<=[.!?。])\s+|\r?\n+/)
    .map((s) => s.replace(/^[\s#>*\-\d.)]+/, "").trim())
    .filter((s) => s.length >= 10 && s.length <= 200);

  const freq = new Map<string, number>();
  const firstSeen = new Map<string, number>();
  const sentenceTerms = sentences.map((s) => {
    const words = (s.match(/[가-힣A-Za-z][가-힣A-Za-z0-9]+/g) ?? [])
      .map((w) => {
        const stripped = w.replace(PARTICLE, "");
        return stripped.length >= 2 ? stripped : w;
      })
      .filter((w) => w.length >= 2 && !STOPWORDS.has(w.toLowerCase()));
    for (const w of words) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
      if (!firstSeen.has(w)) firstSeen.set(w, firstSeen.size);
    }
    return words;
  });

  const terms = [...freq.keys()].sort((a, b) => freq.get(b)! - freq.get(a)! || firstSeen.get(a)! - firstSeen.get(b)!);
  const scored: Scored[] = sentences
    .map((text, index) => ({ text, index, score: sentenceTerms[index].reduce((acc, w) => acc + (freq.get(w) ?? 0), 0) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return { sentences, terms, scored };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
