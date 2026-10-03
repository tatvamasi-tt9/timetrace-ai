# TimeTrace

> **Explore the past. Connect the evidence.**

TimeTrace is an AI-powered historical research assistant that answers questions using a curated collection of **15,000+ Wikipedia historical articles**.

Instead of relying solely on an LLM's internal knowledge, TimeTrace retrieves relevant historical evidence using **hybrid search — BM25 + semantic embeddings — and then uses Google Gemini 2.5 Flash to generate grounded answers with supporting sources.**

<img width="1829" height="864" alt="image" src="https://github.com/user-attachments/assets/8ecd292f-a87b-4aa8-b077-63d8a3159154" />


## Overview

TimeTrace is designed to make historical research conversational while keeping answers connected to their underlying sources.

A typical query flows through:

```text
User Question
      |
      v
Query Rewriting
      |
      v
+-------------------+
|   Hybrid Search   |
|                   |
| BM25 + Semantic   |
+---------+---------+
          |
          v
    RRF Ranking
          |
          v
  Relevant Evidence
          |
          v
  Gemini 2.5 Flash
          |
          v
 Grounded Answer
      + Sources
```

## Key Features

### 1. Hybrid Search

TimeTrace combines two retrieval approaches:

**BM25** handles exact keyword and terminology matching, making it effective for historical names, places, dates, and events.

**Semantic Search** uses `Xenova/all-mpnet-base-v2` to find conceptually related content even when the user's wording differs from the source.

The two result sets are combined using **Reciprocal Rank Fusion (RRF)**.

```text
                 Query
                   |
          +--------+--------+
          |                 |
          v                 v
        BM25        Semantic Search
          |                 |
       Top 100           Top 100
          |                 |
          +--------+--------+
                   |
                   v
              RRF Fusion
                   |
                   v
             Top Evidence
```

### Conversational Search

TimeTrace maintains conversation context and rewrites follow-up questions into standalone search queries.

For example:

```text
User: Why did France support the American colonies?

User: What about the economic reasons?
```

The second question is rewritten using the conversation context before being passed to the retrieval system.

### Grounded Generation

The top retrieved chunks are provided to **Gemini 2.5 Flash**, which generates the answer using the retrieved evidence rather than relying purely on its internal knowledge.

The response includes links to the original Wikipedia articles used as sources.

### Persistent Conversations

Conversation messages and search information are stored in **MongoDB**, allowing users to continue historical discussions across multiple questions.

---

## Architecture

```text
                  React Frontend
                        |
                        v
                 Node.js / Express
                        |
              +---------+---------+
              |                   |
              v                   v
        Conversation        Query Rewriting
           MongoDB              Gemini
              |
              v
        Hybrid Retrieval
          /          \
         v            v
      BM25         MPNet
     SQLite       Embeddings
         \            /
          \          /
           v        v
            RRF Fusion
                |
                v
          Relevant Chunks
                |
                v
         Gemini 2.5 Flash
                |
                v
       Answer + Sources
```

### Data Layer

```text
Wikipedia Articles
        |
        v
     Chunking
        |
   +----+----+
   |         |
   v         v
SQLite     Embeddings
BM25       .npy / MPNet
   |         |
   +----+----+
        |
        v
   Hybrid Retrieval
```

MongoDB is used separately for dynamic application data such as conversation history and search logs.

---
## Tech Stack

### Frontend & Design

![React](https://img.shields.io/badge/REACT-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/VITE-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JAVASCRIPT-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/TAILWIND_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Lucide](https://img.shields.io/badge/LUCIDE-22C55E?style=for-the-badge&logo=lucide&logoColor=white)


### Backend & API

![Node.js](https://img.shields.io/badge/NODE.JS-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/EXPRESS.JS-374151?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MONGODB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLITE-003B57?style=for-the-badge&logo=sqlite&logoColor=white)


### AI & Retrieval

![Gemini](https://img.shields.io/badge/GEMINI-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Transformers.js](https://img.shields.io/badge/TRANSFORMERS.JS-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
![BM25](https://img.shields.io/badge/BM25-2563EB?style=for-the-badge)
![RRF](https://img.shields.io/badge/RRF-7C3AED?style=for-the-badge)
![MPNet](https://img.shields.io/badge/MPNET-FF6F00?style=for-the-badge)


### Data & Knowledge

![Wikipedia](https://img.shields.io/badge/WIKIPEDIA-000000?style=for-the-badge&logo=wikipedia&logoColor=white)
![JSONL](https://img.shields.io/badge/JSONL-0F766E?style=for-the-badge)
![NumPy](https://img.shields.io/badge/NUMPY-013243?style=for-the-badge&logo=numpy&logoColor=white)


### Development & Deployment

![Git](https://img.shields.io/badge/GIT-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white)
![Vercel](https://img.shields.io/badge/VERCEL-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## Getting Started

### Prerequisites

* Node.js
* MongoDB
* Google Gemini API key

### Clone

```bash
git clone https://github.com/tatvamasi-tt9/timetrace-ai.git
cd timetrace-ai
```

### Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=3001
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

Start the server:

```bash
node index.js
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

The frontend communicates with the Node.js API and provides the conversational research interface.

---

## Retrieval Pipeline

TimeTrace currently uses:

* **15,000+ historical Wikipedia articles**
* **BM25 lexical retrieval**
* **MPNet 768-dimensional embeddings**
* **Cosine similarity**
* **RRF hybrid ranking**
* **Gemini-powered query rewriting**
* **Gemini 2.5 Flash generation**
* **Wikipedia source attribution**

The system retrieves first and generates second:

```text
Search → Rank → Retrieve Evidence → Generate → Cite
```

This architecture helps keep historical answers grounded in the indexed knowledge base.

---

## Future Improvements

* PostgreSQL + pgvector for unified storage
* Approximate nearest-neighbor vector search
* Retrieval evaluation and ranking optimization
* Reranking
* Streaming responses
* Larger historical corpus
* Timeline-based exploration

---

## Knowledge Source

TimeTrace uses **Wikipedia articles as its historical knowledge base**. Retrieved answers include links back to the relevant Wikipedia articles so users can inspect the underlying evidence.

---
## Screenshots
<img width="1888" height="836" alt="image" src="https://github.com/user-attachments/assets/3441cb71-e835-476d-9aeb-e56140edde12" />
<img width="1877" height="858" alt="image" src="https://github.com/user-attachments/assets/3eec02d9-e619-48d4-b475-0989384d6de4" />
<img width="1876" height="849" alt="image" src="https://github.com/user-attachments/assets/b16ef862-7485-4575-8547-788b2db8217d" />


## Author

**Tushar Tiwari**

[GitHub](https://github.com/tatvamasi-tt9)

---

> **TimeTrace — Explore the past. Connect the evidence.**
