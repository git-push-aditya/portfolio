"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import LatticeLoader from "@/components/LatticeLoader";
import SpecularButton from "@/components/SpecularButton";

const SUGGESTIONS = ["What kind of builder is Aditya?", "What's he building now?", "Walk me through his resume"];

type Message = { role: "user" | "assistant"; content: string };

// ponytail: hand-rolled bold/italic/newline resolver — full markdown needs a
// parser dependency, this covers what the model actually emits.
function renderMarkdownLite(text: string) {
  const lines = text.split("\n");
  return lines.map((line, li) => (
    <Fragment key={li}>
      {li > 0 && <br />}
      {line.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link)
          return (
            <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="underline">
              {link[1]}
            </a>
          );
        if (part.startsWith("**") && part.endsWith("**"))
          return (
            <strong key={i} style={{ color: "var(--accent-muted)" }}>
              {part.slice(2, -2)}
            </strong>
          );
        if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
        return part;
      })}
    </Fragment>
  ));
}

const STORAGE_KEY = "chat_messages";
const TTL_MS = 4 * 24 * 60 * 60 * 1000;

function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const { ts, messages } = JSON.parse(raw);
    if (Date.now() - ts > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return messages;
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), messages }));
  } catch {}
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [floating, setFloating] = useState(false);
  const [light, setLight] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  // SpecularButton colors are WebGL uniforms, not CSS — they can't read
  // var(--foreground) at paint time, so mirror the theme attribute here.
  useEffect(() => {
    const root = document.documentElement;
    const theme = root.dataset.theme || localStorage.getItem("theme") || "dark";
    setLight(theme === "light");
    const sync = () => setLight(root.dataset.theme === "light");
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Trigger lives inline in the hero; once its section scrolls mostly out of
  // view, pin it to the corner so the chat stays reachable further down the page.
  useEffect(() => {
    const section = triggerRef.current?.closest("section");
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setFloating(entry.intersectionRatio < 0.3), {
      threshold: [0, 0.3, 1],
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (!open) document.body.removeAttribute("data-cursor-suspended");
  }, [open]);

  async function send() {
    const content = input.trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    saveMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error("bad response");

      const withReply = [...next, { role: "assistant" as const, content: "" }];
      setMessages(withReply);
      setLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant" as const, content: reply }]);
      }
      const finalMessages = [...next, { role: "assistant" as const, content: reply }];
      setMessages(finalMessages);
      saveMessages(finalMessages);
    } catch {
      const withReply = [...next, { role: "assistant" as const, content: "Something went wrong — try again in a moment." }];
      setMessages(withReply);
      saveMessages(withReply);
      setLoading(false);
    }
  }

  return (
    <>
      <div ref={triggerRef} className={floating ? "fixed bottom-4 right-4 z-30" : ""}>
        <SpecularButton
          size="sm"
          radius={57}
          tint={light ? "#ffffff" : "#0a0a0b"}
          tintOpacity={1}
          blur={0}
          textColor={light ? "#18181b" : "#f5f5f5"}
          lineColor={light ? "#16a34a" : "#4ade80"}
          baseColor={light ? "#d4d4d8" : "#525252"}
          intensity={1}
          shineSize={10}
          shineFade={35}
          thickness={2}
          speed={0.8}
          followMouse={false}
          proximity={200}
          autoAnimate
          onClick={() => setOpen(true)}
          className="cursor-target"
        >
          Ask about Aditya
        </SpecularButton>
      </div>

      {open && (
        <div
          onMouseEnter={() => document.body.setAttribute("data-cursor-suspended", "true")}
          onMouseLeave={() => document.body.removeAttribute("data-cursor-suspended")}
          className="fixed bottom-4 right-4 z-30 flex h-[34rem] w-72 cursor-auto flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:w-80"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-medium text-foreground">Ask about Aditya</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-muted hover:text-foreground">
              ✕
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 py-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col justify-between gap-3 pt-4">
                <p className="text-sm text-muted">
                  Aditya Dubey is an AI &amp; Backend Engineer. Get to know his work better via a simple chat.
                </p>
                <div className="flex flex-col">
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setInput(q);
                        inputRef.current?.focus();
                      }}
                      className="flex cursor-pointer items-center justify-between gap-2 border-b border-border py-2 text-left text-sm text-foreground last:border-b-0 hover:text-accent"
                    >
                      {q}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-accent">
                        <path d="M7 17L17 7M17 7H8M17 7V16" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`w-fit max-w-[85%] overflow-hidden rounded-lg px-3 py-2 text-left text-sm break-words ${
                  m.role === "user" ? "ml-auto bg-accent text-black" : "mr-auto bg-background text-foreground"
                }`}
              >
                {renderMarkdownLite(m.content)}
              </div>
            ))}
            {loading && (
              <div className="mr-auto w-fit">
                <LatticeLoader label="Thinking" cellSize={5} fontSize={13} showTimer={false} />
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card p-1.5 pl-4 m-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 cursor-pointer rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
