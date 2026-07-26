import { notFound } from "next/navigation";
import { getAllSubscribers, getSubscriberCount } from "@/lib/subscriberStore";

export const metadata = {
  robots: { index: false, follow: false },
};

// 사업자등록 + 결제 연동을 시작할 기준선 — 이 숫자에 도달하면 다음 단계로 넘어갈 시점.
const LAUNCH_THRESHOLD = 20;

// 선착순 무료 이용권 약속 — 이 인원까지는 결제 오픈 시 심화 리포트 1회를 무료로
// 열어줘야 한다는 뜻. subscribedAt 오름차순 기준 순번으로 판단한다.
const FREE_UNLOCK_LIMIT = 20;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  // 비밀키가 안 맞으면 "접근 거부"가 아니라 아예 존재하지 않는 페이지처럼 처리 —
  // 이메일 등 개인정보가 담긴 페이지라 존재 자체를 드러내지 않는 게 안전하다.
  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) {
    notFound();
  }

  const [count, subscribers] = await Promise.all([
    getSubscriberCount(),
    getAllSubscribers(),
  ]);

  const progress = Math.min(100, Math.round((count / LAUNCH_THRESHOLD) * 100));
  const reached = count >= LAUNCH_THRESHOLD;

  // 무료 이용권 대상(선착순 가입 순번) 계산 — 오름차순으로 다시 정렬해서 순번을 매긴다.
  const earliestFirst = [...subscribers].sort((a, b) =>
    a.subscribedAt.localeCompare(b.subscribedAt)
  );
  const freeUnlockEmails = new Set(
    earliestFirst.slice(0, FREE_UNLOCK_LIMIT).map((s) => s.email)
  );

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <p className="text-[11px] tracking-[0.35em] text-[var(--accent)] font-medium mb-4 uppercase">
          Admin · 비공개
        </p>
        <h1 className="font-serif-kr text-3xl font-semibold mb-10">
          구독자 현황
        </h1>

        <div className="card-surface rounded-2xl p-7 mb-8">
          <div className="flex items-end justify-between mb-3">
            <span className="font-serif-kr text-4xl font-semibold tabular-nums">
              {count}
              <span className="text-lg text-[var(--muted)]"> / {LAUNCH_THRESHOLD}명</span>
            </span>
            {reached && (
              <span className="text-xs font-medium text-[var(--ok)]">
                ✓ 사업자등록 진행 기준 도달
              </span>
            )}
          </div>
          <div className="h-2.5 rounded-full bg-[var(--background)] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, background: "var(--accent)" }}
            />
          </div>
          <p className="text-xs text-[var(--muted)] mt-3">
            {reached
              ? `${LAUNCH_THRESHOLD}명을 넘었어요 — 이제 사업자등록 + 결제(PG) 연동을 시작할 시점이에요.`
              : `${LAUNCH_THRESHOLD - count}명 더 모이면 사업자등록을 진행할 기준에 도달해요.`}
          </p>
        </div>

        <div className="card-surface rounded-2xl p-5 mb-8 text-xs text-[var(--muted)] leading-relaxed">
          🎁 <strong className="text-[var(--foreground)]">선착순 {FREE_UNLOCK_LIMIT}명 무료 이용권 약속</strong> —
          결제 오픈 시 아래 표에서 "무료권" 배지가 붙은 분들께는 심화 리포트 1회를
          무료로 열어드려야 해요. 잊지 말 것.
        </div>

        <div className="card-surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b hairline text-left text-xs text-[var(--muted)]">
                  <th className="p-4">이메일</th>
                  <th className="p-4">시즌</th>
                  <th className="p-4">관심 등급</th>
                  <th className="p-4">유입 경로</th>
                  <th className="p-4">신청일</th>
                  <th className="p-4">무료권</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.email} className="border-b hairline last:border-0">
                    <td className="p-4">{s.email}</td>
                    <td className="p-4 text-[var(--muted)]">{s.season ?? "—"}</td>
                    <td className="p-4 text-[var(--muted)]">{s.tier ?? "—"}</td>
                    <td className="p-4 text-[var(--muted)]">{s.source}</td>
                    <td className="p-4 text-[var(--muted)] whitespace-nowrap">
                      {new Date(s.subscribedAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="p-4">
                      {freeUnlockEmails.has(s.email) && (
                        <span className="text-[10px] font-medium text-[var(--accent)] bg-[var(--accent-tint)] px-2 py-1 rounded-full whitespace-nowrap">
                          🎁 무료권
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {subscribers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--muted)]">
                      아직 구독자가 없어요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
