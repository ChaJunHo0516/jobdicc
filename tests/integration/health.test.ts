import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("헬스체크", () => {
  it("DB 연결이 정상이면 ok 를 반환한다", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
