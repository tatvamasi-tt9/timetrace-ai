const router = require("express").Router();
const crypto = require("crypto");

const {
    Bm25Search
} = require("../retrieve/searchquery");

const SearchLog =
    require("../Models/SearchLogModel");

const ChatMessage =
    require("../Models/ChatMessageModel");

const {
    rewriteQuery,
    generateAnswer
} = require("../Controller/llmPipeline");


// ============================================================
// EXISTING SEARCH ROUTE
// ============================================================

router.get("/search", async (req, res) => {

    try {

        const query =
            req.query.q;

        if (!query) {
            return res.json({
                results: []
            });
        }


        const startTime =
            performance.now();


        const {
            results,
            correctedtokens
        } =
            await Bm25Search(query);


        const topresults =
            results.slice(0, 20);


        const correctedQuery =
            correctedtokens.join(" ");


        const wasCorrected =
            query.toLowerCase() !==
            correctedQuery.toLowerCase();


        const processingTimeMs =
            Math.round(
                performance.now() -
                startTime
            );


        SearchLog.create({
            query: query,
            correctedTo:
                wasCorrected
                    ? correctedQuery
                    : null,
            resultsFound:
                results.length,
            processingTimeMs
        }).catch(err =>
            console.error(
                "Failed to log search:",
                err
            )
        );


        return res.status(200).json({

            results: topresults,

            correctedQuery:
                wasCorrected
                    ? correctedQuery
                    : null
        });


    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error:
                "Internal server error"
        });
    }
});


// ============================================================
// ANONYMOUS CONVERSATIONAL RAG
// ============================================================

router.post("/ask", async (req, res) => {

    try {

        const userQuery =
            (req.body.message || "").trim();


        if (!userQuery) {

            return res.status(400).json({
                error:
                    "Message is required"
            });
        }


        // ----------------------------------------------------
        // Reuse existing session or create a new one
        // ----------------------------------------------------

        const sessionId =
            req.body.sessionId ||
            crypto.randomUUID();


        // ----------------------------------------------------
        // Load previous conversation
        // ----------------------------------------------------

        const history =
            await ChatMessage
                .find({
                    sessionId
                })
                .sort({
                    createdAt: -1
                })
                .limit(10)
                .lean();


        // We loaded newest first.
        // Put them back in chronological order.
        history.reverse();


        // ----------------------------------------------------
        // Rewrite query for follow-up questions
        // ----------------------------------------------------

        const searchQuery =
            await rewriteQuery(
                userQuery,
                history
            );


        console.log(
            `User query: ${userQuery}`
        );

        console.log(
            `Search query: ${searchQuery}`
        );


        // ----------------------------------------------------
        // Hybrid retrieval
        // ----------------------------------------------------

        const {
            results
        } =
            await Bm25Search(
                searchQuery
            );


        // ----------------------------------------------------
        // Give Gemini only the strongest chunks
        // ----------------------------------------------------

        const contextChunks =
            results
                .slice(0, 8)
                .filter(chunk =>
                    chunk.text &&
                    chunk.text.trim()
                );


        // ----------------------------------------------------
        // No useful retrieval
        // ----------------------------------------------------

        if (
            contextChunks.length === 0
        ) {

            await ChatMessage.create({

                sessionId,

                role: "user",

                content: userQuery
            });


            const fallback =
                "I couldn't find enough relevant information in my historical sources to answer that question.";


            await ChatMessage.create({

                sessionId,

                role: "assistant",

                content: fallback
            });


            return res.status(200).json({

                sessionId,

                answer: fallback,

                sources: [],

                searchQuery
            });
        }


        // ----------------------------------------------------
        // Generate grounded answer
        // ----------------------------------------------------

        const answer =
            await generateAnswer({

                query: userQuery,

                history,

                chunks:
                    contextChunks
            });


        // ----------------------------------------------------
        // Save user message
        // ----------------------------------------------------

        await ChatMessage.create({

            sessionId,

            role: "user",

            content: userQuery
        });


        // ----------------------------------------------------
        // Save assistant response
        // ----------------------------------------------------

        await ChatMessage.create({

            sessionId,

            role: "assistant",

            content: answer
        });


        // ----------------------------------------------------
        // Sources for frontend
        // ----------------------------------------------------

        const sources =
            contextChunks.map(
                (chunk, index) => ({

                    sourceNumber:
                        index + 1,

                    title:
                        chunk.title,

                    section:
                        chunk.section,

                    url:
                        chunk.url,

                    chunkIndex:
                        chunk.chunk_index
                })
            );


        // ----------------------------------------------------
        // Send response
        // ----------------------------------------------------

        return res.status(200).json({

            sessionId,

            answer,

            sources,

            searchQuery
        });


    } catch (err) {

        console.error(
            "Historical assistant error:",
            err
        );


        return res.status(500).json({

            error:
                "Failed to generate answer"
        });
    }
});


module.exports = router;