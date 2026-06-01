"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatCircle, X, PaperPlaneTilt } from "@phosphor-icons/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface LessonContext {
  headline: string;
  type: string;
  coreIdea: string;
  example: string;
  realWorldUse: string;
}

export function LessonChat({ lessonContext }: { lessonContext: LessonContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  function close() {
    abortRef.current?.abort();
    setOpen(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

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
        body: JSON.stringify({ messages: next, lessonContext }),
        signal: abortRef.current.signal,
      });

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

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-4 sm:right-6 z-30 w-14 h-14 rounded-full
              bg-clay text-cream border-2 border-transparent
              shadow-hard-clay press-clay grid place-items-center"
            aria-label="Open lesson chat"
          >
            <ChatCircle size={26} weight="fill" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
            className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-40 flex flex-col
              bg-paper border-t-2 border-line rounded-t-[2rem] overflow-hidden
              max-h-[600px]"
            style={{ height: "65dvh" }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b-2 border-line">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-clay-deep">
                  Lesson tutor
                </p>
                <p className="mt-0.5 text-sm font-bold text-ink leading-snug truncate">
                  {lessonContext.headline}
                </p>
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
                  <div className="w-12 h-12 rounded-full bg-sun-tint border-2 border-line grid place-items-center mb-3">
                    <ChatCircle size={22} weight="fill" className="text-clay-deep" />
                  </div>
                  <p className="font-bold text-ink text-sm">Got a question?</p>
                  <p className="mt-1 text-sm text-ink-faint leading-relaxed max-w-[30ch]">
                    I have the full lesson context. Ask anything about this material.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[84%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
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
                  <div className="max-w-[84%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed bg-cream border-2 border-line text-ink">
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
            <div className="shrink-0 px-4 pb-6 pt-3 border-t-2 border-line">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask about this lesson…"
                  disabled={streaming}
                  className="flex-1 h-11 rounded-xl border-2 border-line bg-cream px-4 text-sm text-ink
                    placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-clay
                    disabled:opacity-50"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || streaming}
                  className="shrink-0 w-11 h-11 rounded-xl bg-clay text-cream border-2 border-transparent
                    shadow-hard-clay press-clay grid place-items-center
                    disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                  aria-label="Send"
                >
                  <PaperPlaneTilt size={18} weight="fill" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
