"use client";

import { useState } from "react";

export default function SubscribeForm({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "구독에 실패했습니다.");
      setStatus("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="text-sm text-[var(--accent)] font-medium py-3">
        구독해주셔서 감사해요! 매주 컬러 레터로 찾아뵐게요 ✉️
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소"
          className="flex-1 rounded-full border hairline bg-[var(--background)] px-5 py-3.5 outline-none focus:border-[var(--accent)] text-sm"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary text-sm font-medium px-6 py-3.5 rounded-full shrink-0 disabled:opacity-50"
        >
          {status === "loading" ? "..." : "구독"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-500 mt-2">{message}</p>
      )}
      <p className="text-[11px] text-[var(--muted)] mt-3">
        구독 시 매주 컬러·스타일링 팁 레터를 보내드려요. 언제든 해지할 수 있어요.
      </p>
    </form>
  );
}
