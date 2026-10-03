import { useEffect, useState } from "react";

import {
  Moon,
  Sun,
  Plus,
  ArrowUp,
  Database,
  BookOpen,
  Clock3,
  Sparkles,
} from "lucide-react";

import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const suggestions = [
  "Why did France support the American colonies?",
  "How did the Industrial Revolution change Europe?",
  "What caused the fall of the Roman Empire?",
  "How did the Cold War begin?",
];

function Typewriter({
  text,
  speed = 70,
  delay = 0,
  className = "",
  cursor = true,
}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let timeout;
    let interval;

    setDisplayed("");

    timeout = setTimeout(() => {
      let index = 0;

      interval = setInterval(() => {
        index += 1;

        setDisplayed(text.slice(0, index));

        if (index >= text.length) {
          clearInterval(interval);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, speed, delay]);

  return (
    <span className={className}>
      {displayed}

      {cursor && (
        <span className="ml-1 animate-pulse text-cyan-400">
          |
        </span>
      )}
    </span>
  );
}

function TimeTraceLogo({ small = false }) {
  return (
    <div
      className={`relative flex items-center justify-center ${
        small ? "h-9 w-9" : "h-12 w-12"
      }`}
    >
      <div className="absolute inset-0 rounded-2xl bg-cyan-400/10 blur-xl" />

      <div
        className={`relative flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_0_30px_rgba(34,211,238,0.08)] ${
          small ? "h-9 w-9" : "h-12 w-12"
        }`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className={small ? "h-6 w-6" : "h-7 w-7"}
        >
          <defs>
            <linearGradient
              id="timetrace-gradient"
              x1="5"
              y1="6"
              x2="43"
              y2="42"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#22D3EE" />
              <stop offset="0.55" stopColor="#3B82F6" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>

          <circle
            cx="24"
            cy="24"
            r="16"
            stroke="url(#timetrace-gradient)"
            strokeWidth="2.5"
          />

          <path
            d="M24 15V24L30 28"
            stroke="url(#timetrace-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M7 34C12 31 15 35 19 33C23 31 25 35 29 34C33 33 35 29 41 30"
            stroke="url(#timetrace-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <circle
            cx="41"
            cy="30"
            r="2"
            fill="#22D3EE"
          />
        </svg>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [dark, setDark] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedTheme =
      localStorage.getItem("timetrace_theme");

    const isDark =
      savedTheme === null
        ? true
        : savedTheme === "dark";

    setDark(isDark);

    document.documentElement.classList.toggle(
      "dark",
      isDark
    );

    const savedSession =
      localStorage.getItem("timetrace_session_id");

    if (savedSession) {
      setSessionId(savedSession);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      dark
    );

    localStorage.setItem(
      "timetrace_theme",
      dark ? "dark" : "light"
    );
  }, [dark]);

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput("");

    localStorage.removeItem(
      "timetrace_session_id"
    );
  };

  const sendMessage = async (text = input) => {
    const message = text.trim();

    if (!message || loading) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: message,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            sessionId,
          }),
        }
      );

      const data = await response.json();

      if (data.sessionId) {
        setSessionId(data.sessionId);

        localStorage.setItem(
          "timetrace_session_id",
          data.sessionId
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.answer ||
            "I couldn't generate an answer.",
          sources: data.sources || [],
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Something went wrong while reaching TimeTrace.",
          sources: [],
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isLanding = messages.length === 0;

  return (
    <div
      className={`min-h-screen overflow-x-hidden transition-colors duration-500 ${
        dark
          ? "bg-[#05070b] text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Ambient background */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div
          className={`absolute left-1/2 top-[-220px] h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-[120px] ${
            dark
              ? "bg-cyan-500/[0.07]"
              : "bg-cyan-400/[0.08]"
          }`}
        />

        <div
          className={`absolute bottom-[-180px] right-[-100px] h-[420px] w-[420px] rounded-full blur-[120px] ${
            dark
              ? "bg-violet-500/[0.05]"
              : "bg-violet-400/[0.06]"
          }`}
        />

        <div
          className={`absolute inset-0 ${
            dark
              ? "opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)]"
              : "opacity-[0.035] [background-image:linear-gradient(rgba(15,23,42,1)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,1)_1px,transparent_1px)]"
          } [background-size:48px_48px]`}
        />

      </div>

      {/* Navbar */}

      <header className="relative z-20 flex items-center justify-between px-5 py-5 md:px-8">

        <button
          type="button"
          onClick={newChat}
          className="group flex items-center gap-3"
        >
          <TimeTraceLogo small />

          <div className="text-left">

            <div
              className={`text-sm font-semibold tracking-tight ${
                dark
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              TimeTrace
            </div>

            <div
              className={`text-[9px] uppercase tracking-[0.18em] ${
                dark
                  ? "text-slate-600"
                  : "text-slate-400"
              }`}
            >
              Historical intelligence
            </div>

          </div>
        </button>

        <div className="flex items-center gap-2">

          {/* New Chat only when actually in a conversation */}

          {!isLanding && (
            <button
              type="button"
              onClick={newChat}
              className={`hidden items-center gap-2 rounded-xl border px-3.5 py-2 text-xs transition sm:flex ${
                dark
                  ? "border-white/[0.06] bg-white/[0.025] text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  : "border-slate-200 bg-white text-slate-500 shadow-sm hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Plus size={14} />
              New chat
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              setDark((prev) => !prev)
            }
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
              dark
                ? "border-white/[0.06] bg-white/[0.025] text-slate-500 hover:text-white"
                : "border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900"
            }`}
          >
            {dark ? (
              <Sun size={15} />
            ) : (
              <Moon size={15} />
            )}
          </button>

        </div>

      </header>

      <main
        className={`relative z-10 px-4 ${
          isLanding ? "pb-24" : "pb-40"
        }`}
      >

        {isLanding ? (

          <section className="mx-auto flex min-h-[calc(100vh-100px)] max-w-5xl flex-col items-center justify-center text-center">

            {/* Eyebrow */}

            <div
              className={`mb-7 flex items-center gap-2 rounded-full px-3.5 py-2 text-[10px] uppercase tracking-[0.2em] animate-[fade-up_0.7s_ease-out_0.1s_both] ${
                dark
                  ? "border border-white/[0.07] bg-white/[0.025] text-slate-500"
                  : "border border-slate-200 bg-white/80 text-slate-500 shadow-sm"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              AI-powered historical research
            </div>

            {/* Logo */}

            <div className="mb-6 animate-[fade-up_0.8s_ease-out_0.2s_both]">
              <TimeTraceLogo />
            </div>

            {/* Static title */}

            <h1
              className={`animate-[fade-up_0.8s_ease-out_0.2s_both] text-5xl font-semibold tracking-[-0.045em] sm:text-7xl md:text-8xl ${
                dark
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              TimeTrace
            </h1>

            {/* Typewriter */}

            <div
              className={`mt-4 min-h-[42px] text-lg tracking-tight sm:text-xl md:text-2xl ${
                dark
                  ? "text-slate-300"
                  : "text-slate-700"
              }`}
            >
              <Typewriter
                text="Explore the past. Connect the evidence."
                speed={48}
                delay={700}
                className={
                  dark
                    ? "text-slate-300"
                    : "text-slate-700"
                }
              />
            </div>

            {/* Description */}

            <p
              className={`mt-6 max-w-xl text-sm leading-6 sm:text-[15px] animate-[fade-up_0.8s_ease-out_1.8s_both] ${
                dark
                  ? "text-slate-400"
                  : "text-slate-600"
              }`}
            >
              Ask questions about history and discover
              answers grounded in a curated collection
              of historical sources.
            </p>

            {/* Ask TimeTrace */}

            <div
              className="mt-8 w-full max-w-2xl animate-[fade-up_0.8s_ease-out_2s_both]"
            >
              <ChatInput
                value={input}
                setValue={setInput}
                onSend={() => sendMessage()}
                loading={loading}
                dark={dark}
                landing
              />
            </div>

            {/* Try asking */}

            <div
              className="mt-10 w-full max-w-3xl animate-[fade-up_0.8s_ease-out_2.2s_both]"
            >
              <div
                className={`mb-4 text-[10px] font-medium uppercase tracking-[0.2em] ${
                  dark
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                Try asking
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-2">

                {suggestions.map(
                  (suggestion, index) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() =>
                        sendMessage(suggestion)
                      }
                      style={{
                        animationDelay: `${
                          2.4 + index * 0.12
                        }s`,
                      }}
                      className={`group rounded-2xl border p-4 text-left transition duration-300 animate-[fade-up_0.7s_ease-out_both] hover:-translate-y-0.5 ${
                        dark
                          ? "border-white/[0.06] bg-white/[0.02] hover:border-cyan-400/15 hover:bg-white/[0.04]"
                          : "border-slate-200 bg-white/80 shadow-sm hover:border-cyan-300 hover:bg-white hover:shadow-md"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">

                        <Clock3
                          size={14}
                          className={`transition ${
                            dark
                              ? "text-slate-600 group-hover:text-cyan-400/70"
                              : "text-slate-400 group-hover:text-cyan-500"
                          }`}
                        />

                        <ArrowUp
                          size={14}
                          className={`rotate-45 transition ${
                            dark
                              ? "text-slate-600 group-hover:text-cyan-400"
                              : "text-slate-400 group-hover:text-cyan-500"
                          }`}
                        />

                      </div>

                      <div
                        className={`text-sm leading-6 transition ${
                          dark
                            ? "text-slate-400 group-hover:text-slate-200"
                            : "text-slate-600 group-hover:text-slate-900"
                        }`}
                      >
                        {suggestion}
                      </div>
                    </button>
                  )
                )}

              </div>
            </div>

            {/* =================================================
    FEATURES
================================================== */}

<div
  className="mt-28 w-full max-w-6xl pb-12 animate-[fade-up_0.8s_ease-out_2.8s_both]"
>
  {/* Divider */}

  <div
    className={`mb-20 h-px w-full ${
      dark
        ? "bg-white/[0.06]"
        : "bg-slate-200"
    }`}
  />

  {/* Section heading */}

  <div className="mb-14 text-center">

    <h2
      className={`text-4xl font-semibold tracking-[-0.03em] sm:text-5xl ${
        dark
          ? "text-white"
          : "text-slate-900"
      }`}
    >
      Built for evidence-grounded history
    </h2>

    <p
      className={`mx-auto mt-4 max-w-2xl text-sm leading-7 sm:text-base ${
        dark
          ? "text-slate-400"
          : "text-slate-600"
      }`}
    >
      Search Wikipedia, connect relevant evidence,
      and explore historical questions through a
      conversational research interface.
    </p>

  </div>

  {/* Feature cards */}

  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

    {/* ------------------------------------------------
        CARD 1
    ------------------------------------------------- */}

    <div
      className={`group min-h-[330px] rounded-3xl border p-8 transition duration-300 hover:-translate-y-1 ${
        dark
          ? "border-white/[0.07] bg-white/[0.025] hover:border-cyan-400/20 hover:bg-white/[0.04]"
          : "border-slate-200 bg-white shadow-sm hover:border-cyan-300 hover:shadow-lg"
      }`}
    >

      <div
        className="
          mb-10
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-cyan-400/10
          ring-1
          ring-cyan-400/10
        "
      >
        <BookOpen
          size={25}
          className="text-cyan-400"
        />
      </div>

      <h3
        className={`text-xl font-semibold ${
          dark
            ? "text-white"
            : "text-slate-900"
        }`}
      >
        15,000+ Wikipedia Articles
      </h3>

      <p
        className={`mt-5 text-sm leading-7 ${
          dark
            ? "text-slate-400"
            : "text-slate-600"
        }`}
      >
        A curated collection of more than
        15,000 Wikipedia articles forms the
        knowledge base behind TimeTrace's
        historical research.
      </p>

    </div>

    {/* ------------------------------------------------
        CARD 2
    ------------------------------------------------- */}

    <div
      className={`group min-h-[330px] rounded-3xl border p-8 transition duration-300 hover:-translate-y-1 ${
        dark
          ? "border-white/[0.07] bg-white/[0.025] hover:border-blue-400/20 hover:bg-white/[0.04]"
          : "border-slate-200 bg-white shadow-sm hover:border-blue-300 hover:shadow-lg"
      }`}
    >

      <div
        className="
          mb-10
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-blue-400/10
          ring-1
          ring-blue-400/10
        "
      >
        <Database
          size={25}
          className="text-blue-400"
        />
      </div>

      <h3
        className={`text-xl font-semibold ${
          dark
            ? "text-white"
            : "text-slate-900"
        }`}
      >
        Hybrid Search
      </h3>

      <p
        className={`mt-5 text-sm leading-7 ${
          dark
            ? "text-slate-400"
            : "text-slate-600"
        }`}
      >
        Combines lexical and semantic retrieval
        to find relevant Wikipedia evidence,
        even when your question uses different
        wording from the original article.
      </p>

    </div>

    {/* ------------------------------------------------
        CARD 3
    ------------------------------------------------- */}

    <div
      className={`group min-h-[330px] rounded-3xl border p-8 transition duration-300 hover:-translate-y-1 ${
        dark
          ? "border-white/[0.07] bg-white/[0.025] hover:border-violet-400/20 hover:bg-white/[0.04]"
          : "border-slate-200 bg-white shadow-sm hover:border-violet-300 hover:shadow-lg"
      }`}
    >

      <div
        className="
          mb-10
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-violet-400/10
          ring-1
          ring-violet-400/10
        "
      >
        <Sparkles
          size={25}
          className="text-violet-400"
        />
      </div>

      <h3
        className={`text-xl font-semibold ${
          dark
            ? "text-white"
            : "text-slate-900"
        }`}
      >
        Evidence-Grounded Answers
      </h3>

      <p
        className={`mt-5 text-sm leading-7 ${
          dark
            ? "text-slate-400"
            : "text-slate-600"
        }`}
      >
        Answers are generated using retrieved
        evidence rather than relying only on
        the model's internal knowledge, with
        the supporting articles shown alongside
        the response.
      </p>

    </div>

        {/* ------------------------------------------------
            CARD 4
        ------------------------------------------------- */}

        <div
          className={`group min-h-[330px] rounded-3xl border p-8 transition duration-300 hover:-translate-y-1 ${
            dark
              ? "border-white/[0.07] bg-white/[0.025] hover:border-cyan-400/20 hover:bg-white/[0.04]"
              : "border-slate-200 bg-white shadow-sm hover:border-cyan-300 hover:shadow-lg"
          }`}
        >

          <div
            className="
              mb-10
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              bg-cyan-400/10
              ring-1
              ring-cyan-400/10
            "
          >
            <Clock3
              size={25}
              className="text-cyan-400"
            />
          </div>

          <h3
            className={`text-xl font-semibold ${
              dark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            Conversational Context
          </h3>

          <p
            className={`mt-5 text-sm leading-7 ${
              dark
                ? "text-slate-400"
                : "text-slate-600"
            }`}
          >
            Follow-up questions remain connected to
            the conversation, allowing you to explore
            a historical topic without repeatedly
            restating the context.
          </p>

        </div>

      </div>

      {/* Bottom statement */}

      <div className="mt-14 text-center">

        <p
          className={`text-xs uppercase tracking-[0.2em] ${
            dark
              ? "text-slate-600"
              : "text-slate-400"
          }`}
        >
          Search · Retrieve · Connect · Understand
        </p>

      </div>

    </div>

          </section>

        ) : (

          <section className="mx-auto max-w-3xl space-y-8 pt-8">

            {messages.map(
              (message, index) => (
                <MessageBubble
                  key={`${message.role}-${index}`}
                  message={message}
                  dark={dark}
                />
              )
            )}

            {loading && (
              <div
                className={`flex items-center gap-3 text-sm animate-message-in ${
                  dark
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                <TimeTraceLogo small />

                <div className="flex gap-1.5">

                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400/60" />

                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400/60"
                    style={{
                      animationDelay: "120ms",
                    }}
                  />

                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400/60"
                    style={{
                      animationDelay: "240ms",
                    }}
                  />

                </div>
              </div>
            )}

          </section>
        )}

      </main>

      {!isLanding && (
        <ChatInput
          value={input}
          setValue={setInput}
          onSend={() => sendMessage()}
          loading={loading}
          dark={dark}
        />
      )}

    </div>
  );
}