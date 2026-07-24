import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { ANALYSIS_SYSTEM_PROMPT } from "@/lib/personalColor";
import {
  getClientIp,
  checkIpLimit,
  readQuotaCookie,
  makeQuotaCookie,
} from "@/lib/guards";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

// ---- 비용 가드레일 설정 ----
const DAILY_LIMIT_PER_BROWSER = 5; // 서명 쿠키 기준 하루 5회
const DAILY_LIMIT_PER_IP = 10; // 같은 IP 하루 10회
const BURST_LIMIT = 3; // 2분에 3회까지
const BURST_WINDOW_MS = 2 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_FILE_BYTES = 10 * 1024; // 10KB 미만은 정상 사진일 수 없음
const MIN_DIMENSION = 200; // 가로/세로 200px 미만 거부

const QUOTA_COOKIE = "cf_q";

function withQuotaCookie(res: NextResponse, count: number): NextResponse {
  res.cookies.set(QUOTA_COOKIE, makeQuotaCookie(count), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  return res;
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다. .env.local을 확인해주세요." },
      { status: 500 }
    );
  }

  // ---- 1) 횟수 제한 (API 호출 전, 비용 0원 단계에서 차단) ----
  const ip = getClientIp(request);

  if (!checkIpLimit(`burst:${ip}`, BURST_LIMIT, BURST_WINDOW_MS)) {
    return NextResponse.json(
      { error: "요청이 너무 잦아요. 2분 후에 다시 시도해주세요." },
      { status: 429 }
    );
  }

  if (!checkIpLimit(`daily:${ip}`, DAILY_LIMIT_PER_IP, DAY_MS)) {
    return NextResponse.json(
      { error: "오늘 이 네트워크의 진단 횟수를 모두 사용했어요. 내일 다시 만나요!" },
      { status: 429 }
    );
  }

  const usedToday = readQuotaCookie(request.cookies.get(QUOTA_COOKIE)?.value);
  if (usedToday === null) {
    // 쿠키 위조 시도 → 즉시 차단
    return NextResponse.json(
      { error: "비정상적인 요청이 감지됐어요." },
      { status: 403 }
    );
  }
  if (usedToday >= DAILY_LIMIT_PER_BROWSER) {
    return NextResponse.json(
      { error: `무료 진단은 하루 ${DAILY_LIMIT_PER_BROWSER}회까지예요. 내일 다시 이용해주세요.` },
      { status: 429 }
    );
  }
  const newCount = usedToday + 1;

  try {
    // ---- 2) 파일 기본 검증 (비용 0원) ----
    const formData = await request.formData();
    const file = formData.get("photo");
    const name = (formData.get("name") as string | null)?.trim() || "고객";

    if (!(file instanceof File)) {
      return withQuotaCookie(
        NextResponse.json({ error: "사진을 업로드해주세요." }, { status: 400 }),
        usedToday
      );
    }

    if (!ALLOWED_TYPES.includes(file.type as AllowedType)) {
      return withQuotaCookie(
        NextResponse.json(
          { error: "지원하지 않는 이미지 형식입니다. JPG, PNG, WEBP, GIF 중 하나를 사용해주세요." },
          { status: 400 }
        ),
        usedToday
      );
    }

    if (file.size < MIN_FILE_BYTES) {
      return withQuotaCookie(
        NextResponse.json(
          { error: "사진이 너무 작아요. 얼굴이 잘 보이는 선명한 사진을 올려주세요." },
          { status: 400 }
        ),
        usedToday
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return withQuotaCookie(
        NextResponse.json(
          { error: "이미지 용량이 너무 큽니다. 8MB 이하 사진을 사용해주세요." },
          { status: 400 }
        ),
        usedToday
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ---- 3) 해상도 검증 (비용 0원) — 깨진 파일/초소형 이미지 거부 ----
    try {
      const sharp = (await import("sharp")).default;
      const meta = await sharp(buffer).metadata();
      if (
        !meta.width ||
        !meta.height ||
        meta.width < MIN_DIMENSION ||
        meta.height < MIN_DIMENSION
      ) {
        return withQuotaCookie(
          NextResponse.json(
            { error: "해상도가 너무 낮아요. 최소 200×200px 이상의 사진을 올려주세요." },
            { status: 400 }
          ),
          usedToday
        );
      }
    } catch {
      return withQuotaCookie(
        NextResponse.json(
          { error: "이미지 파일을 읽을 수 없어요. 다른 사진으로 시도해주세요." },
          { status: 400 }
        ),
        usedToday
      );
    }

    const base64 = buffer.toString("base64");
    const mediaType = file.type as AllowedType;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const imageBlock = {
      type: "image" as const,
      source: { type: "base64" as const, media_type: mediaType, data: base64 },
    };

    // ---- 4) 저가 모델 얼굴 검문 — 얼굴 아니면 본 분석(고비용) 진입 차단 ----
    const gate = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 30,
      system:
        '이미지 검수기다. 이미지에 퍼스널컬러 분석이 가능한 실제 사람 얼굴(정면 또는 준정면, 피부가 보이는)이 명확히 있으면 {"face":true}, 아니면 {"face":false}만 출력해라. 다른 텍스트 금지. 그림/애니메이션 캐릭터/동물/사물/풍경은 모두 false다.',
      messages: [
        {
          role: "user",
          content: [imageBlock, { type: "text", text: "검수해줘." }],
        },
      ],
    });

    const gateText = gate.content.find((b) => b.type === "text");
    const faceOk =
      gateText?.type === "text" && /"face"\s*:\s*true/.test(gateText.text);

    if (!faceOk) {
      // 검문 실패도 쿼터 1회 차감 (검문 자체도 소액 비용이 들므로 반복 악용 방지)
      return withQuotaCookie(
        NextResponse.json(
          {
            error:
              "사람 얼굴이 잘 보이는 사진이 아니에요. 정면 얼굴 사진으로 다시 시도해주세요.",
          },
          { status: 400 }
        ),
        newCount
      );
    }

    // ---- 5) 본 분석 ----
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4200,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            imageBlock,
            {
              type: "text",
              text: `이 사진 속 인물(호칭: ${name}님)의 퍼스널컬러를 분석해서, 지정된 JSON 형식으로만 답변해줘.`,
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("분석 결과를 받지 못했습니다.");
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("결과 형식을 해석할 수 없습니다.");
    }

    const result = JSON.parse(jsonMatch[0]);
    return withQuotaCookie(NextResponse.json(result), newCount);
  } catch (error) {
    console.error("[analyze] 분석 실패:", error);
    return withQuotaCookie(
      NextResponse.json(
        { error: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      ),
      newCount
    );
  }
}
