import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";

export interface Subscriber {
  email: string;
  name: string | null;
  season: string | null;
  source: string;
  tier: string | null;
  subscribedAt: string;
}

export interface UpsertInput {
  email: string;
  name?: string | null;
  season?: string | null;
  source?: string;
  tier?: string | null;
}

/**
 * Vercel(서버리스)에는 영구 파일시스템이 없다 — 배포 환경에서는 Upstash Redis(REST)를 쓰고,
 * 로컬 개발 중 Redis 환경변수가 없을 때만 data/subscribers.json 파일로 폴백한다.
 */
const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis =
  REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

const REDIS_HASH_KEY = "colorfit:subscribers";
const FILE_PATH = path.join(process.cwd(), "data", "subscribers.json");

async function readFileList(): Promise<Subscriber[]> {
  try {
    return JSON.parse(await fs.readFile(FILE_PATH, "utf-8"));
  } catch {
    return [];
  }
}

async function writeFileList(list: Subscriber[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
}

export const storageMode = redis ? "redis" : "file";

export async function upsertSubscriber(input: UpsertInput): Promise<void> {
  if (redis) {
    const existing = await redis.hget<Subscriber>(REDIS_HASH_KEY, input.email);
    const record: Subscriber = existing
      ? {
          ...existing,
          tier: input.tier ?? existing.tier,
          source: input.source ?? existing.source,
        }
      : {
          email: input.email,
          name: input.name ?? null,
          season: input.season ?? null,
          source: input.source ?? "unknown",
          tier: input.tier ?? null,
          subscribedAt: new Date().toISOString(),
        };
    await redis.hset(REDIS_HASH_KEY, { [input.email]: record });
    return;
  }

  const list = await readFileList();
  const existing = list.find((s) => s.email === input.email);
  if (existing) {
    existing.tier = input.tier ?? existing.tier;
    existing.source = input.source ?? existing.source;
  } else {
    list.push({
      email: input.email,
      name: input.name ?? null,
      season: input.season ?? null,
      source: input.source ?? "unknown",
      tier: input.tier ?? null,
      subscribedAt: new Date().toISOString(),
    });
  }
  await writeFileList(list);
}
