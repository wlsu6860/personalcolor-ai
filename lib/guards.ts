import crypto from "crypto";
import type { NextRequest } from "next/server";

const SECRET = process.env.QUOTA_SECRET || "colorfit-dev-secret-change-me";

/* ---------- IP 추출 ---------- */

export function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "local";
}

/* ---------- 인메모리 IP 리미터 (버스트 + 일일) ---------- */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function pruneExpired() {
  if (buckets.size < 5000) return;
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

/** windowMs 동안 limit회까지 허용. 초과 시 false */
export function checkIpLimit(key: string, limit: number, windowMs: number): boolean {
  pruneExpired();
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

/* ---------- 서명된 일일 쿼터 쿠키 ----------
 * 형식: {YYYY-MM-DD}.{count}.{hmac}
 * 클라이언트가 값을 조작하면 서명 불일치로 0회 취급이 아니라 즉시 차단한다.
 */

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 24);
}

/** 쿠키에서 오늘 사용량을 읽는다. 없으면 0, 위조면 null */
export function readQuotaCookie(value: string | undefined): number | null {
  if (!value) return 0;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [date, countStr, sig] = parts;
  if (sign(`${date}.${countStr}`) !== sig) return null;
  if (date !== todayUtc()) return 0; // 날짜 지난 쿠키는 리셋
  const count = parseInt(countStr, 10);
  return Number.isFinite(count) && count >= 0 ? count : null;
}

export function makeQuotaCookie(count: number): string {
  const payload = `${todayUtc()}.${count}`;
  return `${payload}.${sign(payload)}`;
}
