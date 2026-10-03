const mongoose=require('mongoose')
const searchLogSchema=new mongoose.Schema({
    query: { type: String, required: true },
    
    // If our fuzzy matcher fixed a typo (e.g., "artifical" -> "artificial")
    correctedTo: { type: String, default: null }, 
    
    resultsFound: { type: Number, required: true },
    processingTimeMs: { type: Number, required: true },
    
    timestamp: { type: Date, default: Date.now }
})

module.exports = mongoose.model('SearchLog', searchLogSchema);