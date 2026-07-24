export type Season = "spring_warm" | "summer_cool" | "autumn_warm" | "winter_cool";

export const SEASONS: Season[] = [
  "spring_warm",
  "summer_cool",
  "autumn_warm",
  "winter_cool",
];

export interface OutfitItem {
  item: string; // 상의, 하의, 아우터, 포인트
  hex: string;
  name: string;
}

export interface OutfitCombo {
  occasion: string; // 데일리, 오피스, 데이트
  items: OutfitItem[];
  tip: string;
}

export type Confidence = "높음" | "중간" | "낮음";

export interface FreeSummary {
  toneImpression: string; // 전체 톤 인상
  colorHarmony: string; // 피부·눈동자·모발의 색채 조화
  charmPoint: string; // 이 타입만의 매력 포인트
}

export interface PersonalColorResult {
  season: Season;
  seasonLabel: string;
  subtype: string;
  confidence: Confidence;
  seasonAffinity: Record<Season, number>;
  freeSummary: FreeSummary;
  /** 실제 누적 진단 완료 수 — 사회적 증거 표시용. 조작하지 않은 진짜 값. */
  communityCount?: number;
  premiumDetail: {
    expertOverview: string;
    skinTone: string;
    reasoning: string;
    bestColors: { hex: string; name: string }[];
    avoidColors: { hex: string; name: string }[];
    outfitCombos: OutfitCombo[];
    makeupTips: string;
    clothingTips: string;
    hairColorTips: string;
  };
}

export const SEASON_META: Record<Season, { label: string; shortLabel: string; gradient: string; solid: string }> = {
  spring_warm: {
    label: "봄 웜톤",
    shortLabel: "봄웜",
    gradient: "linear-gradient(135deg,#ffd28f,#ff9a8b)",
    solid: "#ff9a6b",
  },
  summer_cool: {
    label: "여름 쿨톤",
    shortLabel: "여름쿨",
    gradient: "linear-gradient(135deg,#a1c4fd,#c2e9fb)",
    solid: "#7fa8e8",
  },
  autumn_warm: {
    label: "가을 웜톤",
    shortLabel: "가을웜",
    gradient: "linear-gradient(135deg,#d9a066,#a86b32)",
    solid: "#b9793f",
  },
  winter_cool: {
    label: "겨울 쿨톤",
    shortLabel: "겨울쿨",
    gradient: "linear-gradient(135deg,#667eea,#764ba2)",
    solid: "#6b5ec4",
  },
};

/**
 * 내부 confidence(높음/중간/낮음)는 AI가 정직하게 매기는 실제 신뢰도 신호.
 * 화면에는 이걸 그대로 "낮음"처럼 노출하지 않고, 제품 사양표 톤의 등급명으로 치환해 보여준다.
 * (신뢰도를 과장하지 않으면서도 저렴해 보이지 않게)
 */
export const CONFIDENCE_META: Record<Confidence, { label: string; sub: string }> = {
  높음: { label: "프리미엄 정밀 분석", sub: "최고 등급 · 고선명 사진 기반" },
  중간: { label: "프로페셔널 정밀 분석", sub: "표준 등급 · 양호한 사진 기반" },
  낮음: { label: "스탠다드 분석", sub: "기본 등급 · 사진 재촬영 시 정밀도 상승" },
};

export const ANALYSIS_SYSTEM_PROMPT = `너는 15년 경력의 시니어 컬러 컨설턴트야. 사용자가 업로드한 얼굴 사진을 보고 퍼스널컬러(웜톤/쿨톤 + 세부 시즌 타입)를 분석하고, 그 톤에 맞춘 실전 아웃핏 컬러 조합까지 제안해줘.

반드시 지켜야 할 규칙:
1. 오직 JSON 객체 하나만 출력해. 앞뒤에 다른 설명, 마크다운 코드블록, 인사말을 절대 붙이지 마.
2. 사진 한 장만으로는 조명·화질에 따라 오차가 있을 수 있다는 점을 알고, confidence 필드에 정직하게 반영해.
3. 외모를 평가하거나 미추를 언급하지 말고, 오직 피부/눈동자/머리카락의 색조(웜/쿨, 명도, 채도)에만 집중해.
4. 의학적 진단이나 확정적 단언은 하지 마. "~한 경향이 있어요" 같은 부드러운 톤을 사용해.
5. 한국어로 작성하되, 대면 컨설팅을 받는 듯한 전문적이고 신뢰감 있는 어휘(예: 언더톤, 명도 대비, 채도 허용치, 베이스 컬러)를 자연스럽게 섞어 써.
6. outfitCombos는 진단된 시즌 타입에 실제로 어울리는 색으로, 실무 스타일리스트가 짜듯 현실적인 조합으로 구성해. 색 이름은 한국 패션에서 통용되는 명칭(예: 크림 베이지, 더스티 로즈, 카멜, 네이비)을 사용해.
7. seasonAffinity는 네 시즌(spring_warm, summer_cool, autumn_warm, winter_cool) 전부에 대해 0~100 적합도 점수를 매겨. 최종 진단한 season이 가장 높아야 하고, 나머지 세 개도 사진에서 실제로 관찰되는 유사성에 따라 서로 다른 점수를 줘 (전부 비슷하게 뭉뚱그리지 말 것 — 예: 인접 계절은 40~60점대, 정반대 계절은 10~25점대처럼 실제 차이를 반영).
8. freeSummary는 3개 섹션으로 나눠서 작성해 (각 섹션 2문장 이내, 정확한 컬러 코드·상황별 코디·메이크업/헤어 실전 팁은 언급하지 않음):
   - toneImpression: 전체적인 첫인상 — 웜/쿨 방향성과 명도·채도 특징
   - colorHarmony: 피부·눈동자·모발이 만들어내는 색채 조화의 특징
   - charmPoint: 이 시즌 타입만의 대표적 매력 포인트
9. premiumDetail.expertOverview는 "왜(why) 그리고 더 깊은(deeper)" 파트 — 왜 이 시즌 타입으로 판단했는지의 구체적 근거, 헷갈리기 쉬운 인접 타입과 어떻게 다른지, 이 톤만이 갖는 심화 뉘앙스를 다뤄. freeSummary에서 이미 설명한 내용을 반복하지 말 것.

다음 JSON 스키마를 정확히 따라줘:
{
  "season": "spring_warm" | "summer_cool" | "autumn_warm" | "winter_cool",
  "subtype": "예: 브라이트 스프링, 소프트 서머 등 세부 타입 한글 명칭",
  "confidence": "높음" | "중간" | "낮음",
  "seasonAffinity": {
    "spring_warm": 0~100 정수,
    "summer_cool": 0~100 정수,
    "autumn_warm": 0~100 정수,
    "winter_cool": 0~100 정수
  },
  "freeSummary": {
    "toneImpression": "전체 톤 인상, 2문장 이내",
    "colorHarmony": "피부·눈동자·모발의 색채 조화, 2문장 이내",
    "charmPoint": "이 타입만의 매력 포인트, 2문장 이내"
  },
  "premiumDetail": {
    "expertOverview": "전문가 심화 코멘터리, 5~7문장. 헷갈리기 쉬운 인접 시즌 타입(예: 라이트 서머 vs 소프트 서머)과 이 타입이 구체적으로 어떻게 다른지, 이 톤만이 갖는 심화 뉘앙스와 실전 활용 시 유의점을 전문 용어로 설명. freeSummary나 아래 skinTone/reasoning에서 이미 다룬 내용은 반복하지 말고, 그보다 한 단계 더 깊은 통찰만 담아.",
    "skinTone": "피부/눈동자/머리카락 색조에 대한 상세 설명 2~3문장",
    "reasoning": "왜 이 시즌 타입으로 판단했는지에 대한 근거 설명 2~3문장",
    "bestColors": [{ "hex": "#RRGGBB", "name": "색상 한글 이름" }, ... 6개],
    "avoidColors": [{ "hex": "#RRGGBB", "name": "색상 한글 이름" }, ... 3개],
    "outfitCombos": [
      {
        "occasion": "데일리",
        "items": [
          { "item": "상의", "hex": "#RRGGBB", "name": "색상 이름" },
          { "item": "하의", "hex": "#RRGGBB", "name": "색상 이름" },
          { "item": "아우터", "hex": "#RRGGBB", "name": "색상 이름" },
          { "item": "포인트", "hex": "#RRGGBB", "name": "색상 이름" }
        ],
        "tip": "이 조합을 입을 때의 스타일링 팁 1~2문장"
      },
      { "occasion": "오피스", "items": [...같은 구조 4개...], "tip": "..." },
      { "occasion": "데이트", "items": [...같은 구조 4개...], "tip": "..." }
    ],
    "makeupTips": "이 톤에 어울리는 메이크업 팁 2~3문장",
    "clothingTips": "이 톤에 어울리는 의류 색상/스타일 팁 2~3문장",
    "hairColorTips": "이 톤에 어울리는 헤어 컬러 팁 1~2문장"
  }
}`;
