import { Redis } from "@upstash/redis";

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis =
  REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

const KEY = "colorfit:stats:total_analyses";

// Redis가 없는 로컬 개발 환경에서만 쓰는 메모리 카운터 (재시작하면 0으로 리셋, 정상)
let memoryCounter = 0;

/**
 * 사회적 증거 지표는 절대 조작하지 않는다 — 실제 분석 완료 횟수만 반환한다.
 * 표시 여부(임계값 이상일 때만 노출)는 호출하는 쪽(UI)의 책임이다.
 */
export async function incrementAnalysisCount(): Promise<number> {
  if (redis) return redis.incr(KEY);
  memoryCounter += 1;
  return memoryCounter;
}

export async function getAnalysisCount(): Promise<number> {
  if (redis) return (await redis.get<number>(KEY)) ?? 0;
  return memoryCounter;
}
