// 아웃핏 조합을 단순 색상 블록이 아니라 옷 모양 실루엣(플랫레이 스타일)으로 보여준다.
// 실사진에 옷을 합성하는 방식(가상 피팅)은 별도 이미지 생성 API 연동과 진단당
// 추가 비용, 품질 편차 위험이 있어 채택하지 않고, 대신 비용·리스크 없이도
// "이 색 옷을 이렇게 입으면" 감을 훨씬 잘 전달하는 실루엣 방식을 택했다.
const SHAPES: Record<string, string> = {
  상의:
    "M9 2.5 4 5.5v3.5l2.2-1V21h11.6V8l2.2 1V5.5L15 2.5c-.6 1.2-1.8 2-3 2s-2.4-.8-3-2z",
  하의: "M6 2.5h12l.6 8.5.9 10h-5l-.9-9-.9 9H7.6l.9-10z",
  아우터:
    "M8.5 2.5 4 5v4l2.2-1V21h4V9.5h3.6V21h4V4l-2.2 1v-4L14 2.5c-.5 1.1-1.6 1.8-2.5 1.8S9 3.6 8.5 2.5z",
  신발: "M4 15.5c1-1.5 2.6-2.5 4-3l3.5-2.5c.8-.6 1.8-.5 2.4.3l1.6 2.2c2.4.2 5 1 6.5 2.5.6.6.4 1.5-.4 1.7-3.7 1-9.2 1.3-14 1.1-1.8-.1-3.9-.5-3.6-2.3z",
  "가방/액세서리":
    "M8 8V6a4 4 0 0 1 8 0v2h2.5L20 21H4l1.5-13zm2 0h4V6a2 2 0 0 0-4 0z",
  포인트:
    "M12 3c1 2.3 2.7 4 5 5-2.3 1-4 2.7-5 5-1-2.3-2.7-4-5-5 2.3-1 4-2.7 5-5z",
};

const DEFAULT_SHAPE = SHAPES["가방/액세서리"];

export default function OutfitItemIcon({
  item,
  hex,
  className,
}: {
  item: string;
  hex: string;
  className?: string;
}) {
  const path = SHAPES[item] ?? DEFAULT_SHAPE;
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label={`${item} 색상 미리보기`}
    >
      <path d={path} fill={hex} stroke="rgba(0,0,0,0.12)" strokeWidth="0.5" />
    </svg>
  );
}
