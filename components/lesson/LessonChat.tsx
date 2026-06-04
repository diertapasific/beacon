"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatCircle, X, PaperPlaneTilt, ProhibitInset } from "@phosphor-icons/react";

const CHAT_DAILY_LIMIT = 10;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function LessonChat({
  lessonId,
  lessonHeadline,
}: {
  lessonId: string;
  lessonHeadline: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Fetch quota whenever the panel opens.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 260);
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d: { remaining?: number }) => {
        if (typeof d.remaining === "number") setRemaining(d.remaining);
      })
      .catch(() => {});
    return () => clearTimeout(t);
  }, [open]);

  const close = useCallback(() => {
    abortRef.current?.abort();
    setOpen(false);
  }, []);

  const exhausted = remaining !== null && remaining <= 0;

  async function send() {
    const text = input.trim();
    if (!text || streaming || exhausted) return;

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setStreamingContent("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, lessonId }),
        signal: abortRef.current.signal,
      });

      // Header is available before stream body arrives.
      const headerRemaining = res.headers.get("X-Chat-Remaining");
      if (headerRemaining !== null) setRemaining(Number(headerRemaining));

      if (res.status === 429) {
        setRemaining(0);
        setMessages((prev) => prev.slice(0, -1));
        setInput(text);
        return;
      }

      if (!res.ok || !res.body) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Something went wrong. Try again." },
        ]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamingContent(full);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: full }]);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Something went wrong. Try again." },
        ]);
      }
    } finally {
      setStreaming(false);
      setStreamingContent("");
    }
  }

  const quotaColor =
    remaining === null
      ? "text-ink-faint"
      : remaining <= 2
      ? "text-berry"
      : remaining <= 5
      ? "text-clay-deep"
      : "text-ink-faint";

  return (
    <>
      {/* FAB — toggles open/close */}
      <motion.button
        animate={open ? { scale: 1 } : { scale: 1 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => (open ? close() : setOpen(true))}
        className="fixed bottom-6 right-4 sm:right-6 z-40 w-14 h-14 rounded-full
          bg-clay text-cream border-2 border-transparent
          shadow-hard-clay press-clay grid place-items-center"
        aria-label={open ? "Close lesson chat" : "Open lesson chat"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.18 }}
            >
              <X size={22} weight="bold" />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <ChatCircle size={26} weight="fill" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating popup panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="popup"
            initial={{ opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed bottom-24 right-4 sm:right-6 z-40
              w-[calc(100vw-2rem)] sm:w-[380px]
              h-[480px] max-h-[65dvh]
              flex flex-col
              bg-paper rounded-2xl border-2 border-line
              shadow-[0_8px_40px_-4px_rgba(0,0,0,0.14)]
              overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b-2 border-line bg-cream">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-clay-deep">
                  Lesson tutor
                </p>
                <p className="mt-0.5 text-sm font-bold text-ink leading-snug truncate">
                  {lessonHeadline}
                </p>
                {remaining !== null && (
                  <p className={`mt-0.5 font-mono text-[10px] font-bold tabular-nums ${quotaColor}`}>
                    {remaining}/{CHAT_DAILY_LIMIT} questions left today
                  </p>
                )}
              </div>
              <button
                onClick={close}
                className="shrink-0 ml-3 w-8 h-8 rounded-full border-2 border-line
                  grid place-items-center text-ink-soft
                  hover:text-ink hover:bg-paper-2 transition-colors"
                aria-label="Close chat"
              >
                <X size={15} weight="bold" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {messages.length === 0 && !streaming && (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
                  {exhausted ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-berry-tint border-2 border-line grid place-items-center mb-3">
                        <ProhibitInset size={22} weight="fill" className="text-berry" />
                      </div>
                      <p className="font-bold text-ink text-sm">Daily limit reached</p>
                      <p className="mt-1 text-sm text-ink-faint leading-relaxed max-w-[26ch]">
                        You&apos;ve used all {CHAT_DAILY_LIMIT} questions for today. Come back tomorrow.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-sun-tint border-2 border-line grid place-items-center mb-3">
                        <ChatCircle size={22} weight="fill" className="text-clay-deep" />
                      </div>
                      <p className="font-bold text-ink text-sm">Got a question?</p>
                      <p className="mt-1 text-sm text-ink-faint leading-relaxed max-w-[26ch]">
                        I have the full lesson context. Ask anything about this material.
                      </p>
                    </>
                  )}
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[86%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                      ${msg.role === "user"
                        ? "bg-clay text-cream rounded-br-sm"
                        : "bg-cream border-2 border-line text-ink rounded-bl-sm"
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {streaming && (
                <div className="flex justify-start">
                  <div className="max-w-[86%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed bg-cream border-2 border-line text-ink">
                    {streamingContent || (
                      <span className="flex gap-1 items-center h-5">
                        <span className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input row */}
            <div className="shrink-0 px-4 pb-5 pt-3 border-t-2 border-line bg-cream">
              {exhausted ? (
                <div className="flex items-center justify-center h-11 rounded-xl border-2 border-line bg-paper px-4">
                  <p className="text-sm font-medium text-ink-faint">
                    Daily limit reached — resets tomorrow
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    placeholder="Ask about this lesson…"
                    disabled={streaming}
                    className="flex-1 h-11 rounded-xl border-2 border-line bg-paper px-4 text-sm text-ink
                      placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-clay
                      disabled:opacity-50"
                  />
                  <button
                    onClick={() => void send()}
                    disabled={!input.trim() || streaming}
                    className="shrink-0 w-11 h-11 rounded-xl bg-clay text-cream border-2 border-transparent
                      shadow-hard-clay press-clay grid place-items-center
                      disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                    aria-label="Send"
                  >
                    <PaperPlaneTilt size={18} weight="fill" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
