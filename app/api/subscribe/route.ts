import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getClientIp, checkIpLimit } from "@/lib/guards";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Subscriber {
  email: string;
  name: string | null;
  season: string | null;
  source: string;
  tier: string | null;
  subscribedAt: string;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkIpLimit(`sub:${ip}`, 10, 24 * 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "요청이 너무 많아요. 내일 다시 시도해주세요." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 주소를 입력해주세요." },
        { status: 400 }
      );
    }

    const dir = path.join(process.cwd(), "data");
    const file = path.join(dir, "subscribers.json");
    await fs.mkdir(dir, { recursive: true });

    let list: Subscriber[] = [];
    try {
      list = JSON.parse(await fs.readFile(file, "utf-8"));
    } catch {
      // 파일이 아직 없으면 빈 목록으로 시작
    }

    const existing = list.find((s) => s.email === email);
    const tier = typeof body.tier === "string" && body.tier ? body.tier : null;

    if (existing) {
      existing.tier = tier ?? existing.tier;
      existing.source = typeof body.source === "string" ? body.source : existing.source;
    } else {
      list.push({
        email,
        name: typeof body.name === "string" && body.name ? body.name : null,
        season: typeof body.season === "string" && body.season ? body.season : null,
        source: typeof body.source === "string" ? body.source : "unknown",
        tier,
        subscribedAt: new Date().toISOString(),
      });
    }
    await fs.writeFile(file, JSON.stringify(list, null, 2), "utf-8");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[subscribe] 구독 처리 실패:", error);
    return NextResponse.json(
      { error: "구독 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
