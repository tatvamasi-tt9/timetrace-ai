import {
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function MessageBubble({
  message,
  dark,
}) {
  const isUser = message.role === "user";

  // ---------------------------------------------------------
  // USER MESSAGE
  // ---------------------------------------------------------

  if (isUser) {
    return (
      <div className="flex w-full justify-end animate-message-in">

        <div
          className="
            max-w-2xl
            rounded-3xl
            rounded-br-lg
            bg-gradient-to-r
            from-blue-600
            to-violet-600
            px-5
            py-3.5
            text-white
            shadow-lg
            shadow-blue-500/10
          "
        >
          <p className="whitespace-pre-wrap text-sm leading-7">
            {message.content}
          </p>
        </div>

      </div>
    );
  }

  // ---------------------------------------------------------
  // ASSISTANT MESSAGE
  // ---------------------------------------------------------

  return (
    <div className="flex w-full justify-start gap-4 animate-message-in">

      {/* TimeTrace icon */}
      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-gradient-to-br
          from-cyan-400
          via-blue-500
          to-violet-600
          shadow-lg
          shadow-cyan-500/10
        "
      >
        <Sparkles
          size={15}
          className="text-white"
        />
      </div>

      <div className="min-w-0 flex-1">

        {/* Assistant name */}
        <div className="mb-2 flex items-center gap-3">

          <span
            className={`text-sm font-medium ${
              dark
                ? "text-slate-300"
                : "text-slate-800"
            }`}
          >
            TimeTrace
          </span>

        </div>

        {/* Answer */}
        <div
          className={`whitespace-pre-wrap text-[15px] leading-7 ${
            message.error
              ? "text-red-500"
              : dark
                ? "text-slate-300"
                : "text-slate-700"
          }`}
        >
          {message.content}
        </div>

        {/* =================================================
            SOURCES
        ================================================== */}

        {!message.error &&
          message.sources?.length > 0 && (
            <div className="mt-7">

              {/* Evidence heading */}
              <div className="mb-3 flex items-center gap-3">

                <div
                  className={`h-px flex-1 ${
                    dark
                      ? "bg-white/10"
                      : "bg-slate-200"
                  }`}
                />

                <span
                  className={`text-[10px] font-medium uppercase tracking-[0.2em] ${
                    dark
                      ? "text-slate-500"
                      : "text-slate-500"
                  }`}
                >
                  Evidence
                </span>

                <div
                  className={`h-px flex-1 ${
                    dark
                      ? "bg-white/10"
                      : "bg-slate-200"
                  }`}
                />

              </div>

              {/* Source cards */}
              <div className="space-y-2">

                {message.sources.map(
                  (source, index) => (
                    <a
                      key={`${source.url}-${index}`}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`group flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                        dark
                          ? "border-white/[0.06] bg-white/[0.025] hover:border-cyan-400/20 hover:bg-white/[0.045]"
                          : "border-slate-200 bg-white shadow-sm hover:border-cyan-300 hover:bg-slate-50 hover:shadow-md"
                      }`}
                    >

                      <div className="min-w-0">

                        <div
                          className={`truncate text-sm font-medium transition ${
                            dark
                              ? "text-slate-300 group-hover:text-cyan-300"
                              : "text-slate-800 group-hover:text-cyan-600"
                          }`}
                        >
                          <span
                            className={
                              dark
                                ? "text-cyan-400"
                                : "text-cyan-600"
                            }
                          >
                            [{source.sourceNumber ?? index + 1}]
                          </span>{" "}
                          {source.title}
                        </div>

                        {source.section && (
                          <div
                            className={`mt-1 text-xs ${
                              dark
                                ? "text-slate-500"
                                : "text-slate-500"
                            }`}
                          >
                            {source.section}
                          </div>
                        )}

                      </div>

                      <ExternalLink
                        size={15}
                        className={`ml-4 shrink-0 transition ${
                          dark
                            ? "text-slate-600 group-hover:text-cyan-400"
                            : "text-slate-400 group-hover:text-cyan-500"
                        }`}
                      />

                    </a>
                  )
                )}

              </div>

            </div>
          )}

      </div>

    </div>
  );
}