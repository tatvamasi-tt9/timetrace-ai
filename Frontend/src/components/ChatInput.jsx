import { ArrowUp } from "lucide-react";

export default function ChatInput({
  value,
  setValue,
  onSend,
  loading,
  dark,
  landing = false,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (!loading && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div
      className={
        landing
          ? "w-full"
          : "fixed bottom-0 left-0 right-0 z-30 px-4 pb-5"
      }
    >
      <div className={landing ? "w-full" : "mx-auto max-w-3xl"}>

        <div
          className={`rounded-[28px] border p-2 backdrop-blur-2xl transition-colors duration-300 ${
            dark
              ? "border-white/[0.08] bg-[#0b0d12]/90 shadow-2xl shadow-black/30"
              : "border-slate-200 bg-white/90 shadow-xl shadow-slate-200/50"
          }`}
        >
          <div className="flex items-end gap-2">

            <textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);

              e.target.style.height = "auto";
              e.target.style.height =
                `${Math.min(e.target.scrollHeight, 128)}px`;
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            placeholder="Ask TimeTrace about the past..."
            className={`min-h-[48px] max-h-32 flex-1 resize-none overflow-hidden bg-transparent px-4 py-3 text-[15px] outline-none transition-colors ${
              dark
                ? "text-white placeholder:text-slate-600"
                : "text-slate-900 placeholder:text-slate-400"
            }`}
          />

            <button
              type="button"
              onClick={onSend}
              disabled={loading || !value.trim()}
              className="
                flex h-11 w-11 shrink-0 items-center justify-center
                rounded-2xl
                bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500
                text-white
                shadow-lg shadow-blue-500/20
                transition
                hover:scale-[1.03]
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <ArrowUp size={19} strokeWidth={2.5} />
            </button>

          </div>
        </div>

        <div
          className={`pt-3 text-center text-[10px] uppercase tracking-[0.2em] ${
            dark ? "text-slate-600" : "text-slate-400"
          }`}
        >
          Evidence-grounded answers
        </div>

      </div>
    </div>
  );
}