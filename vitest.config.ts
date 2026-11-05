import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { tmpdir } from "os";
import { join, sep } from "path";

// 실행마다 OS 임시 폴더에 새 SQLite 파일을 만든다(개발 DB 와 완전히 분리, 기존 DB 초기화 없음).
const testDbFile = join(tmpdir(), `prebridge-test-${process.pid}-${Date.now()}.db`).split(sep).join("/");
const testDbUrl = process.env.TEST_DATABASE_URL ?? "file:" + testDbFile;
const testStorageDir = testDbFile.replace(/\.db$/, "-storage");
process.env.TEST_DATABASE_URL = testDbUrl;
process.env.TEST_STORAGE_DIR = testStorageDir;

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/{unit,integration,security}/**/*.test.ts"],
    globalSetup: ["tests/helpers/global-setup.ts"],
    setupFiles: ["tests/helpers/setup-env.ts"],
    env: { DATABASE_URL: testDbUrl, STORAGE_DIR: testStorageDir },
    // 통합 테스트는 단일 SQLite 파일을 공유하므로 파일 단위 병렬 실행을 끈다.
    fileParallelism: false,
  },
});
