export type Season = "spring_warm" | "summer_cool" | "autumn_warm" | "winter_cool";

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

export interface PersonalColorResult {
  season: Season;
  seasonLabel: string;
  subtype: string;
  confidence: Confidence;
  freeSummary: string;
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

export const SEASON_META: Record<Season, { label: string; gradient: string }> = {
  spring_warm: { label: "봄 웜톤", gradient: "linear-gradient(135deg,#ffd28f,#ff9a8b)" },
  summer_cool: { label: "여름 쿨톤", gradient: "linear-gradient(135deg,#a1c4fd,#c2e9fb)" },
  autumn_warm: { label: "가을 웜톤", gradient: "linear-gradient(135deg,#d9a066,#a86b32)" },
  winter_cool: { label: "겨울 쿨톤", gradient: "linear-gradient(135deg,#667eea,#764ba2)" },
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
7. freeSummary와 premiumDetail.expertOverview는 역할이 다르고 겹치지 않아야 해.
   - freeSummary: 대면 상담 브리핑처럼 "무엇을(what)"을 충실히 설명 — 톤 인상, 피부/눈동자/모발의 색채 조화, 이 시즌 타입의 대표적 매력을 전문 용어를 섞어 읽는 사람이 "진짜 전문가가 봐줬다"고 느낄 만큼 구체적이고 풍부하게 쓴다. 단, 정확한 컬러 코드·상황별 코디·메이크업/헤어 실전 팁은 여기서 언급하지 않는다.
   - expertOverview: "왜(why) 그리고 더 깊은(deeper)" 파트 — 왜 이 시즌 타입으로 판단했는지의 구체적 근거, 헷갈리기 쉬운 인접 타입과 어떻게 다른지, 이 톤만이 갖는 심화 뉘앙스를 다룬다. freeSummary에서 이미 설명한 톤 인상을 반복하지 말 것.

다음 JSON 스키마를 정확히 따라줘:
{
  "season": "spring_warm" | "summer_cool" | "autumn_warm" | "winter_cool",
  "subtype": "예: 브라이트 스프링, 소프트 서머 등 세부 타입 한글 명칭",
  "confidence": "높음" | "중간" | "낮음",
  "freeSummary": "무료로 공개하는 종합 소견, 4~5문장. 전문 컬러리스트가 대면 상담 브리핑에서 설명하듯 풍부하고 구체적으로 — 전체적인 톤 인상, 피부/눈동자/모발이 만들어내는 색채 조화, 이 시즌 타입의 대표적 매력을 전문 용어(언더톤, 명도 대비, 채도 허용치 등)를 섞어 서술. 정확한 컬러 코드나 상황별 코디, 메이크업/헤어 실전 팁은 언급하지 않는다.",
  "premiumDetail": {
    "expertOverview": "전문가 심화 코멘터리, 5~7문장. 헷갈리기 쉬운 인접 시즌 타입(예: 라이트 서머 vs 소프트 서머)과 이 타입이 구체적으로 어떻게 다른지, 이 톤만이 갖는 심화 뉘앙스와 실전 활용 시 유의점을 전문 용어로 설명. freeSummary(톤 인상)나 아래 skinTone/reasoning(기본 근거)에서 이미 다룬 내용은 반복하지 말고, 그보다 한 단계 더 깊은 통찰만 담아.",
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
