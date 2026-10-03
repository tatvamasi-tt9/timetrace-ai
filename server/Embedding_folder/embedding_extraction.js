const { pipeline } = require('@xenova/transformers');

// Storing  the Promise, not the final model
let embedderPromise = null;


function getEmbedder() {
    if (!embedderPromise) {
        console.log("Loading MPNet embedding model (first search might take a moment)...");
        
        embedderPromise = pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2')
            .then(model => {
                console.log("Embedding model loaded successfully.");
                return model;
            })
            .catch(err => {
                console.error("Error loading model:", err);
                embedderPromise = null; // reset kr diya so that it can try again on next search
                throw err;
            });
    }
    return embedderPromise;
}

// this will generate  the embedding for the user's search query
async function generateQueryEmbedding(query) {
    
    const embedder = await getEmbedder();
    const output = await embedder(query, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

module.exports={generateQueryEmbedding};