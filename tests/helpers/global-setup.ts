import { execSync } from "child_process";
import { rmSync } from "fs";

/** 새 임시 SQLite 파일에 마이그레이션을 적용한다. 기존 DB 를 초기화하지 않는다. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !url.includes("prebridge-test-")) throw new Error("TEST_DATABASE_URL 이 테스트 전용 경로가 아닙니다.");
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: url, PRISMA_HIDE_UPDATE_MESSAGE: "1" },
  });
  return () => {
    // 이번 실행에서 만든 임시 파일만 정리한다.
    const file = url.replace(/^file:/, "");
    for (const f of [file, `${file}-journal`]) rmSync(f, { force: true });
    if (process.env.TEST_STORAGE_DIR?.includes("prebridge-test-")) rmSync(process.env.TEST_STORAGE_DIR, { recursive: true, force: true });
  };
}
