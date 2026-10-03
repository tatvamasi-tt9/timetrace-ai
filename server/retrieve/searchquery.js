const sw = require('stopword');
const natural = require("natural");
const fs = require("fs");
const path = require("path");
const {
    generateQueryEmbedding
} = require('../Embedding_folder/embedding_extraction');

const sqlite3 = require("sqlite3").verbose();


// ============================================================
// LOAD EMBEDDINGS
// ============================================================

const npyBuffer = fs.readFileSync(path.join(__dirname,"..","Embedding_folder","history_embeddings.npy"));

// Parse .npy header
const headerLength = npyBuffer.readUInt16LE(8);
const dataOffset = 10 + headerLength;


// Raw Float32 data
const floatArray = new Float32Array(npyBuffer.buffer,npyBuffer.byteOffset + dataOffset,(npyBuffer.length - dataOffset) / 4);


// MPNet embedding dimension
const dimensions = 768;

const embeddings = [];

for (let i = 0;i < floatArray.length;i += dimensions) {

    embeddings.push(floatArray.subarray( i, i + dimensions));
}

console.log(`Successfully loaded ${embeddings.length.toLocaleString()} document embeddings directly from .npy!`);


// ============================================================
// LOAD CHUNKS
// ============================================================

const chunksFile = path.join(__dirname,"..","Data","wikipedia","history_chunks.jsonl");

const chunks = [];

const chunkData = fs.readFileSync(chunksFile,"utf8");

for (const line of chunkData.split("\n")) {

    if (line.trim()) {
        chunks.push(JSON.parse(line));
    }
}

console.log(`Loaded ${chunks.length.toLocaleString()} chunks for inspection`);


// ============================================================
// COSINE SIMILARITY
// ============================================================

function cosine(vecA, vecB) {

    if (!vecA || !vecB) {
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0;i < vecA.length;i++) {

        dotProduct +=vecA[i] * vecB[i];
        normA +=vecA[i] * vecA[i];
        normB +=vecB[i] * vecB[i];
    }

    if (normA === 0 ||normB === 0) {
        return 0;
    }

    return (dotProduct /(Math.sqrt(normA) *Math.sqrt(normB)));
}


// ============================================================
// SQLITE
// ============================================================

let Docnumber = 0;
let avgDocLength = 0;

const db = new sqlite3.Database(path.join(__dirname,"History_search_engine.db"));


db.serialize(() => {

    db.each(
        "SELECT key, value FROM global_stats",
        [],
        (err, row) => {

            if (err) {
                throw err;
            }

            if (row.key === "num_docs") {
                Docnumber = Number(row.value);
            }

            if (row.key ==="avg_doc_length") {
                avgDocLength =
                    Number(row.value);
            }
        }
    );
});




// ============================================================
// TOKENIZATION
// ============================================================

function tokenize(tokens) {

    if (!tokens) {
        return [];
    }

    return sw.removeStopwords(tokens)
    .map(word =>natural.PorterStemmer.stem(word));
}



// ============================================================
// SQLITE QUERY
// ============================================================

function dbQuery(
    sql,
    params = []
) {

    return new Promise(
        (resolve, reject) => {

            db.all(sql,params,(err, rows) => {

                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        }
    );
}


// ============================================================
// SEMANTIC SEARCH
// ============================================================
//
// IMPORTANT:
// This searches ALL embeddings independently.
//
// It does NOT depend on BM25 results.
// ============================================================

function semanticSearch(queryEmbedding,topK = 100) {

    const results = [];

    for (let i = 0;i < embeddings.length;i++) {

        const similarity =cosine(queryEmbedding,embeddings[i]);

        results.push({
            id: i,
            semantic: similarity
        });
    }


    results.sort((a, b) =>b.semantic -a.semantic);

    return results.slice(0,topK);
}


// ============================================================
// RECIPROCAL RANK FUSION
// ============================================================

function reciprocalRankFusion(bm25Results,semanticResults,bm25Weight = 0.5,semanticWeight = 0.5) {

    const RRF_K = 60;
    const combined =new Map();

    // --------------------------------------------------------
    // BM25 ranking
    // --------------------------------------------------------

    for (let i = 0;i < bm25Results.length;i++) {

        const doc =bm25Results[i];

        const rank = i + 1;

        if (!combined.has(doc.id)) {

            combined.set(
                doc.id,
                {
                    id: doc.id,
                    title: doc.title,
                    url: doc.url,

                    bm25: doc.score,
                    bm25Norm: 0,

                    semantic: 0,

                    bm25Rank: rank,
                    semanticRank: null,

                    rrfScore: 0
                }
            );

        } else {

            combined.get(doc.id).bm25Rank = rank;

        }
    }


    // --------------------------------------------------------
    // Semantic ranking
    // --------------------------------------------------------

    for (let i = 0;i < semanticResults.length;i++) {

        const doc =semanticResults[i];

        const rank = i + 1;


        if (!combined.has(doc.id)) {

            // This document was NOT in BM25 top 100.
            // That's the whole point of true hybrid retrieval.

            const chunk =chunks[doc.id];

            combined.set(
                doc.id,
                {
                    id: doc.id,
                    title:chunk?.title || "",
                    url:chunk?.url || "",
                    bm25: 0,
                    bm25Norm: 0,
                    semantic:doc.semantic,
                    bm25Rank: null,
                    semanticRank: rank,
                    rrfScore: 0
                }
            );

        } else {

            const existing =combined.get(doc.id);
            existing.semantic =doc.semantic;
            existing.semanticRank =rank;
        }
    }


    // --------------------------------------------------------
    // Calculate RRF
    // --------------------------------------------------------

    for (const doc of combined.values()) {

        if (doc.bm25Rank !== null) {
            doc.rrfScore +=bm25Weight /(RRF_K +doc.bm25Rank);
        }


        if (doc.semanticRank !== null) {
            doc.rrfScore +=semanticWeight /(RRF_K +doc.semanticRank);
        }
    }


    // --------------------------------------------------------
    // Sort by hybrid score
    // --------------------------------------------------------

    const results =Array.from(combined.values());

    results.sort((a, b) =>b.rrfScore -a.rrfScore);

    return results;
}


// ============================================================
// MAIN SEARCH
// ============================================================

async function Bm25Search(query) {

    const rawtokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

    const tokens = tokenize(rawtokens);
    // ========================================================
    // 2. BM25 SEARCH OVER ALL CHUNKS
    // ========================================================

    const scores =Object.create(null);

    const k1 = 1.5;
    const b = 0.75;


    for (const word of tokens) {

        const rows =
            await dbQuery(
                `
                SELECT
                    p.doc_id,
                    p.tf,
                    d.length,
                    d.title,
                    d.url,
                    t.df
                FROM postings p
                JOIN documents d
                    ON p.doc_id = d.doc_id
                JOIN terms t
                    ON p.term = t.term
                WHERE p.term = ?
                `,
                [word]
            );


        for (const row of rows) {

            const docId =row.doc_id;
            const tf =row.tf;
            const dl =row.length;
            const df =row.df;
            const idf =Math.log((Docnumber -df +0.5) /(df +0.5) +1 );


            let score =idf *((tf *(k1 + 1)) /(tf +k1 *(1 -b +b *(dl /avgDocLength))));   

            if (!scores[docId]) {

                scores[docId] = {

                    id: docId,
                    title: row.title,
                    url: row.url,
                    score: 0,
                };
            }

            scores[docId].score +=score;
        }
    }


    // ========================================================
    // 3. TOP 100 BM25
    // ========================================================

    const bm25Results =Object.values(scores)
        .sort((a, b) =>b.score -a.score).
        slice(0, 100);

    // ========================================================
    // 4. GENERATE QUERY EMBEDDING
    // ========================================================

    const queryEmbedding = await generateQueryEmbedding( query);


    // ========================================================
    // 5. SEMANTIC SEARCH OVER ALL EMBEDDINGS
    // ========================================================

    const semanticResults =semanticSearch(queryEmbedding,100);


    // ========================================================
    // 6. TRUE HYBRID RETRIEVAL
    // ========================================================
    //
    // BM25 top 100
    // +
    // Semantic top 100
    //        ↓
    // RRF
    //
    // A semantic result can now enter the candidate pool
    // even if BM25 ranked it #5000.
    // ========================================================

    const candidates =
        reciprocalRankFusion(
            bm25Results,
            semanticResults,
            0.5,
            0.5
        );

    // ========================================================
    // 7. RETURN RESULTS
    // ========================================================

    for (const result of candidates) {

    const chunk = chunks[result.id];

    result.section = chunk?.section || "";
    result.chunk_index = chunk?.chunk_index ?? -1;
    result.text = chunk?.text || "";
}

    return {
        results: candidates,
    };
}


module.exports = {
    Bm25Search,
};