"use client";

import { FormEvent, useMemo, useState } from "react";

type DryRunResponse = {
  status: string;
  agentResponse?: {
    text?: string;
    requestContact?: boolean;
  };
  replyPayload?: {
    chat_id: number;
    text: string;
    parse_mode: string;
    reply_markup?: unknown;
  };
  error?: string;
  message?: string;
};

const DEFAULT_MESSAGE = "أنا متلخبط ومحتاج أبدأ منين؟";

export default function DebugTelegramPage() {
  const [messageText, setMessageText] = useState(DEFAULT_MESSAGE);
  const [firstName, setFirstName] = useState("محمد");
  const [chatId, setChatId] = useState("0");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [result, setResult] = useState<DryRunResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const payloadPreview = useMemo(() => {
    const parsedChatId = Number(chatId) || 0;
    return {
      update_id: Date.now(),
      message: {
        message_id: 1,
        from: {
          id: 123,
          is_bot: false,
          first_name: firstName || "محمد",
        },
        chat: {
          id: parsedChatId,
          type: "private",
        },
        date: Math.floor(Date.now() / 1000),
        ...(messageText.trim() ? { text: messageText.trim() } : {}),
        ...(phoneNumber.trim()
          ? {
              contact: {
                phone_number: phoneNumber.trim(),
                first_name: firstName || "محمد",
              },
            }
          : {}),
      },
    };
  }, [chatId, firstName, messageText, phoneNumber]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/webhooks/telegram?dryRun=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadPreview),
      });

      const data = (await response.json()) as DryRunResponse;
      if (!response.ok) {
        setResult(data);
        setErrorMessage(data.error || data.message || "حصل خطأ في الـ dry-run");
        return;
      }

      setResult(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "فشل الاتصال بالـ endpoint");
      setResult(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.16),_transparent_30%),linear-gradient(180deg,_#07111f_0%,_#020617_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
          <p className="text-sm font-semibold text-teal-300">Debug Telegram</p>
          <h1 className="mt-2 text-3xl font-black text-white">Telegram Dry-Run Console</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            الصفحة دي للتجربة الداخلية فقط. بتولّد رد الـ agent والـ Telegram payload المتوقع من غير ما تبعت
            أي رسالة حقيقية على Telegram.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-200">
                <span>اسم المستخدم</span>
                <input
                  id="debug-telegram-name"
                  name="debugTelegramName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-teal-400"
                  placeholder="محمد"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-slate-200">
                <span>Chat ID تجريبي</span>
                <input
                  id="debug-telegram-chat-id"
                  name="debugTelegramChatId"
                  value={chatId}
                  onChange={(event) => setChatId(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-teal-400"
                  placeholder="0"
                />
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-2 text-sm text-slate-200">
              <span>الرسالة</span>
              <textarea
                id="debug-telegram-message"
                name="debugTelegramMessage"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                rows={7}
                className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-teal-400"
                placeholder="اكتب رسالة المستخدم هنا"
              />
            </label>

            <label className="mt-4 flex flex-col gap-2 text-sm text-slate-200">
              <span>رقم تليفون تجريبي لو عايز تحاكي مشاركة contact</span>
              <input
                id="debug-telegram-phone"
                name="debugTelegramPhone"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-teal-400"
                placeholder="201001234567"
              />
            </label>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-gradient-to-r from-teal-400 to-cyan-300 px-6 py-3 text-sm font-bold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "بنجرّب..." : "شغّل Dry-Run"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessageText(DEFAULT_MESSAGE);
                  setFirstName("محمد");
                  setChatId("0");
                  setPhoneNumber("");
                  setResult(null);
                  setErrorMessage(null);
                }}
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                رجّع القيم الافتراضية
              </button>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-[1.5rem] border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </div>
            ) : null}
          </form>

          <div className="grid gap-6">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
              <p className="text-sm font-semibold text-cyan-300">Payload Preview</p>
              <pre className="mt-4 overflow-x-auto rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4 text-xs leading-6 text-slate-200">
                {JSON.stringify(payloadPreview, null, 2)}
              </pre>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-teal-300">Agent Output</p>
                {result?.status ? (
                  <span className="rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-200">
                    {result.status}
                  </span>
                ) : null}
              </div>

              {result?.agentResponse?.text ? (
                <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 text-sm leading-8 text-slate-100 whitespace-pre-wrap">
                  {result.agentResponse.text}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                  شغّل الـ dry-run عشان تشوف الرد هنا.
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  requestContact: {result?.agentResponse?.requestContact ? "true" : "false"}
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  parse_mode: {result?.replyPayload?.parse_mode || "Markdown"}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
              <p className="text-sm font-semibold text-fuchsia-300">Telegram Reply Payload</p>
              <pre className="mt-4 overflow-x-auto rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4 text-xs leading-6 text-slate-200">
                {JSON.stringify(result?.replyPayload ?? { status: "waiting" }, null, 2)}
              </pre>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
