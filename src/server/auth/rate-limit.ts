/**
 * 단일 서버 인스턴스용 메모리 기반 고정 윈도우 rate limiter.
 * 다중 인스턴스 운영 시에는 Redis 등 공유 저장소로 교체해야 한다(docs/SECURITY.md 참고).
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export function resetRateLimit(key?: string) {
  if (key) buckets.delete(key);
  else buckets.clear();
}
