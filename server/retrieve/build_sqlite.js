
const sw = require('stopword');
const natural = require("natural");
const fs = require("fs");
const path = require("path");
const readline = require("readline"); 
const outputdir=path.join(__dirname,"shards")
if(!fs.existsSync(outputdir))
    fs.mkdirSync(outputdir);
const filepath=path.join(__dirname,"../Data/wikipedia","extracted_articles.jsonl");
if (fs.existsSync(dbPath))
    fs.unlinkSync(dbPath);



const SAMPLE_SIZE = 30000;

const sqlite3 = require("sqlite3").verbose();
const dbPath = path.join(__dirname, "search_engine.db");
const db = new sqlite3.Database(dbPath);

let insertPosting;
let insertTerm;
let insertDocument;

db.serialize(() => {
    db.exec(`
CREATE TABLE IF NOT EXISTS documents(
    doc_id INTEGER PRIMARY KEY,
    title TEXT,
    url TEXT,
    length INTEGER
);

CREATE TABLE IF NOT EXISTS terms(
    term TEXT PRIMARY KEY,
    df INTEGER
);

CREATE TABLE IF NOT EXISTS postings(
    term TEXT,
    doc_id INTEGER,
    tf INTEGER,
    PRIMARY KEY(term, doc_id)
);

CREATE TABLE IF NOT EXISTS global_stats(
    key TEXT PRIMARY KEY,
    value REAL
);
`);

    db.run("BEGIN TRANSACTION");


     insertPosting = db.prepare(`
    INSERT INTO postings(term, doc_id, tf)
    VALUES (?, ?, ?)
`);

 insertTerm = db.prepare(`
    INSERT INTO terms(term, df)
    VALUES (?, 1)
    ON CONFLICT(term)
    DO UPDATE SET df = df + 1
`);

 insertDocument = db.prepare(`
    INSERT INTO documents(doc_id, title, url, length)
    VALUES (?, ?, ?, ?)
`);
});



function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve();
        });
    });
}

function runStmt(stmt, params = []) {
    return new Promise((resolve, reject) => {
        stmt.run(params, function (err) {
            if (err) reject(err);
            else resolve();
        });
    });
}

function tokenize(text){

     if(!text)return [];
     let tokens=text.toLowerCase().replace(/[^a-z0-9\s]/g,"").split(/\s+/).filter(Boolean)     // replace -> remove punctuation . split -> create an array of the given string , with space removed . for ex- "hello world  welcome to 2026"   after split ["hello", "world", "", "welcome", "to", "2026"]  , boolean remove any left spaces 
     return sw.removeStopwords(tokens).map(word => natural.PorterStemmer.stem(word));          // returns an array of words 
} 
function vocabtokenize(text){

     if(!text)return [];
     let tokens=text.toLowerCase().replace(/[^a-z0-9\s]/g,"").split(/\s+/).filter(Boolean)     // replace -> remove punctuation . split -> create an array of the given string , with space removed . for ex- "hello world  welcome to 2026"   after split ["hello", "world", "", "welcome", "to", "2026"]  , boolean remove any left spaces 
      return tokens
} 

async function buildSQLiteIndex(){
    
    let totalLength = 0;
    let Docnumber = 0;
    


    const fileStream=fs.createReadStream(filepath)      // fs.createReadStream: Creates a Readable Stream connected to the target file path. Instead of copying the whole file into RAM like fs.readFile() does, it opens the file and reads it sequentially in small, manageable chunks (the default chunk size is usually 64 KB).
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });  // the raw chunk recieved , will be split into muliple line on based of linebreaks   . crlfdelay , is taki, dusre operating sytem pe /r/n work nhi krta , mac only takes/ n . dont focus on this much 
    const sample = [];
    let seen = 0;

    for await (const line of rl) {

    if (!line.trim()) continue;

    try {

        const doc = JSON.parse(line);
        seen++;
        if (seen % 5000 === 0)
        console.log(`Sampled ${seen} articles...`);
        if (sample.length < SAMPLE_SIZE) {
            sample.push(doc);
        } else {
            const r = Math.floor(Math.random() * (seen ));
            if (r < SAMPLE_SIZE)
                sample[r] = doc;
        }

        

    } catch (err) {
        console.log(err);
    }
}

console.log(`Random sample selected: ${sample.length} articles`);


    for(const doc of sample)
    {
        

            const tokens=tokenize(doc.text) ;
            
            const vocabtokens = new Set(vocabtokenize(doc.text));
            
            const termFreqs=Object.create(null); // will store all the frequency of all unique words in this token array  // why not directly {}? read this later
            for(const word of tokens)
            {
                if(!termFreqs[word])termFreqs[word]=0;
                termFreqs[word]++;

            }

           for (const word in termFreqs) {

            
                await runStmt(
                insertPosting,
                [word, Docnumber, termFreqs[word]]
            );

             await runStmt(
                insertTerm,
                [word]
            );


            }

            await runStmt(
            insertDocument,
            [
                Docnumber,
                doc.title,
                doc.url,
                tokens.length
            ]
        );

            /*   this is how it looks "currentInvertedIndex": {
            "apple": {
                "0": 2,
                "1": 1   // <--- This is currentInvertedIndex["apple"][1] = 1
            },
            "banana": {
                "0": 1
            },
            "carrot": {
                "1": 1
            }
            }
             */

            
            totalLength+=tokens.length;
            Docnumber++;
           
            if (Docnumber % 1000 === 0) console.log(`Processed ${Docnumber} articles total...`);
            if (Docnumber % 1000 === 0) {
    console.log(process.memoryUsage());
}
    }
    

    await run(
    `INSERT OR REPLACE INTO global_stats(key,value)
     VALUES(?,?)`,
    ["num_docs", Docnumber]
    );

    await run(
        `INSERT OR REPLACE INTO global_stats(key,value)
        VALUES(?,?)`,
        ["avg_doc_length", totalLength / Docnumber]
    );
   


}

(async () => {
    try {
        await buildSQLiteIndex();

        await run("COMMIT");
        console.log("Database committed successfully.");
        await new Promise(resolve => insertPosting.finalize(resolve));
        await new Promise(resolve => insertTerm.finalize(resolve));
        await new Promise(resolve => insertDocument.finalize(resolve));

        await new Promise((resolve, reject) => {
            db.close(err => err ? reject(err) : resolve());
        });
    } catch (err) {
        console.error(err);
    }
})();

