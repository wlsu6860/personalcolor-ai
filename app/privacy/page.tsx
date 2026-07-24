import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침",
};

const SECTIONS = [
  {
    title: "1. 수집하는 개인정보 항목",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>진단 시 업로드하는 얼굴 사진 (AI 분석 목적, 서버에 저장하지 않고 분석 즉시 폐기)</li>
        <li>진단 시 입력하는 호칭/이름 (선택 입력, 리포트 표시용)</li>
        <li>뉴스레터·리포트 언락 신청 시 입력하는 이메일 주소</li>
        <li>서비스 이용 과정에서 자동 생성되는 접속 IP, 쿠키(부정 이용 방지용 일일 이용 횟수 확인)</li>
      </ul>
    ),
  },
  {
    title: "2. 개인정보의 처리 목적",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>업로드한 사진: 퍼스널컬러 분석을 위해 AI 모델(Anthropic Claude API)로 전송·분석. 분석이 끝나면 서버에 별도로 저장하지 않습니다.</li>
        <li>이메일 주소: 아웃핏 컬러 레터 발송, 유료 리포트/멤버십 오픈 안내</li>
        <li>IP·쿠키: 무료 진단 악용(반복 대량 요청) 방지를 위한 일일 이용 횟수 확인</li>
      </ul>
    ),
  },
  {
    title: "3. 개인정보의 제3자 제공 및 처리위탁",
    body: (
      <p>
        업로드된 사진은 분석을 위해 Anthropic, PBC(Claude API)로 전송됩니다. 전송된
        이미지는 분석 응답 생성 후 저희 서버에 저장되지 않으며, Anthropic의
        자체 정책에 따라 처리됩니다. 이메일 주소는 뉴스레터 발송 용도 외에
        제3자에게 제공하지 않습니다.
      </p>
    ),
  },
  {
    title: "4. 개인정보의 보유 및 이용 기간",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>업로드 사진: 분석 처리 완료 즉시 삭제 (별도 보관하지 않음)</li>
        <li>이메일 주소: 수신 거부 또는 삭제 요청 시까지 보유</li>
        <li>접속 로그: 부정 이용 방지 목적상 최대 24시간 이내 자동 소멸</li>
      </ul>
    ),
  },
  {
    title: "5. 이용자의 권리",
    body: (
      <p>
        이용자는 언제든지 등록하신 이메일 주소의 삭제 또는 뉴스레터 수신
        거부를 아래 문의처로 요청하실 수 있습니다.
      </p>
    ),
  },
  {
    title: "6. 문의처",
    body: (
      <p className="text-[var(--accent)]">
        [사업자 정보 입력 예정 — 사업자등록 완료 후 상호, 대표자명, 사업자등록번호,
        통신판매업 신고번호, 이메일을 이 자리에 반드시 기재해야 합니다]
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b hairline">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2.5">
            <span className="font-display italic text-xl tracking-tight">
              Color Fit
            </span>
            <span className="text-xs text-[var(--muted)] tracking-[0.2em]">
              컬러핏
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <h1 className="font-serif-kr text-3xl font-semibold mb-3">
          개인정보처리방침
        </h1>
        <p className="text-sm text-[var(--muted)] mb-12">
          시행일: 2026년 7월 24일
        </p>

        <div className="flex flex-col gap-10 text-sm leading-relaxed">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="font-semibold text-base mb-3">{s.title}</h2>
              <div className="text-[var(--muted)]">{s.body}</div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t hairline">
        <div className="max-w-3xl mx-auto px-6 py-8 text-center">
          <p className="text-xs text-[var(--muted)]">© 2026 Color Fit</p>
        </div>
      </footer>
    </div>
  );
}
