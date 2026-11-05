import type { AllowedExt } from "../storage/file-validation";

/** 업로드 파일에서 AI 처리용 텍스트를 추출한다. 추출 실패 시 빈 문자열을 반환한다(문서 업로드 자체는 허용). */
export async function extractText(bytes: Uint8Array, ext: AllowedExt): Promise<string> {
  if (ext === "txt" || ext === "md") return normalize(new TextDecoder("utf-8").decode(bytes));
  try {
    // 패키지 진입점(index.js)은 디버그 모드에서 테스트 파일을 읽으므로 라이브러리 파일을 직접 불러온다.
    const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
    const result = await pdfParse(Buffer.from(bytes));
    return normalize(result.text);
  } catch {
    return "";
  }
}

function normalize(s: string) {
  return s.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
