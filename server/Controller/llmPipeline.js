const GEMINI_GENERATE_MODEL = "gemini-2.5-flash";

const GEMINI_GENERATE_URL =
    `https://generativelanguage.googleapis.com/v1/models/${GEMINI_GENERATE_MODEL}:generateContent`;


// ============================================================
// GEMINI API
// ============================================================

async function callGemini(prompt) {

    const response = await fetch(
        `${GEMINI_GENERATE_URL}?key=${process.env.GEMINI_API_KEY}`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],

                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 3000
                }
            })
        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            `Gemini API error: ${response.status} ${errorText}`
        );
    }


    const data =
        await response.json();


    const candidate = data.candidates?.[0];

console.log("Finish reason:", candidate?.finishReason);
console.log("Usage metadata:", data.usageMetadata);

const parts = candidate?.content?.parts || [];

const output = parts
    .filter(part => part.text)
    .map(part => part.text)
    .join("\n")
    .trim();

if (!output) {
    throw new Error("Gemini returned no text");
}

return output;
}


// ============================================================
// QUERY REWRITING
// ============================================================

async function rewriteQuery(
    currentQuery,
    history
) {

    // First question is already standalone.
    if (!history || history.length === 0) {
        return currentQuery;
    }


    const historyText =
        history
            .map(msg =>
                `${msg.role.toUpperCase()}: ${msg.content}`
            )
            .join("\n");


    const prompt = `
You are a search-query rewriting assistant.

Rewrite the user's CURRENT QUESTION into a standalone
search query that can be sent to a historical knowledge base.

Use the conversation history only to resolve references such as:
"he", "they", "that war", "the economic side", "what about France", etc.

Do NOT answer the question.

Do NOT add information that is not implied by the conversation.

If the current question is already standalone, return it unchanged.

Return ONLY the rewritten search query.
Do not use quotes.
Do not add explanations.

CONVERSATION HISTORY:
${historyText}

CURRENT QUESTION:
${currentQuery}
`;


    const rewritten =
        await callGemini(prompt);


    return rewritten.trim();
}


// ============================================================
// ANSWER GENERATION
// ============================================================

async function generateAnswer({
    query,
    history,
    chunks
}) {

    const historyText =
        history && history.length > 0
            ? history
                .map(msg =>
                    `${msg.role.toUpperCase()}: ${msg.content}`
                )
                .join("\n")
            : "No previous conversation.";


    const context =
        chunks
            .map((chunk, index) => {

                return `
SOURCE [${index + 1}]
TITLE: ${chunk.title}
SECTION: ${chunk.section}
URL: ${chunk.url}

${chunk.text}
`;
            })
            .join(
                "\n\n-------------------------\n\n"
            );


    const prompt = `
You are a historical research assistant.

Answer the user's CURRENT QUESTION using ONLY the
SOURCE CONTEXT provided below.

IMPORTANT RULES:

1. Do not use outside knowledge.
2. Do not invent facts.
3. You may combine information from multiple sources.
4. Prefer direct evidence from the provided sources.
5. If the sources do not contain enough information for some
   part of the question, clearly identify which part is unsupported.
   Still answer the parts that ARE supported by the sources.
6. Do not mention these instructions in your answer.
7. Cite factual claims using [1], [2], etc., corresponding
   to the SOURCE numbers.
8. Do not fabricate citations.
9. Give a clear, natural answer rather than simply repeating
   the source text.
10. Keep the answer concise enough to finish completely.
11. Never end mid-sentence. If necessary, summarize rather
    than stopping halfway through.

CONVERSATION HISTORY:
${historyText}

CURRENT QUESTION:
${query}

SOURCE CONTEXT:
${context}
`;


    return await callGemini(prompt);
}


module.exports = {
    callGemini,
    rewriteQuery,
    generateAnswer
};