# PROJECT REPORT: Cee
### A Multiplayer RAG & Collaborative AI Learning Platform

---

## 1. Abstract
The traditional approach to studying digital documents (PDFs, recorded lectures) is highly static, isolating, and often inefficient for knowledge retention. **Cee** is a full-stack, AI-driven educational platform designed to transform passive reading into an interactive, competitive, and highly visual learning experience. By leveraging Retrieval-Augmented Generation (RAG), Large Language Models (LLMs), and real-time state synchronization, Cee allows users to automatically generate visual knowledge graphs from their study materials, interact with isolated AI tutors, and seamlessly transition into multiplayer "Battle Rooms" where study groups are tested on dynamically generated, context-aware quizzes.

## 2. Introduction
### 2.1 Problem Statement
Students and professionals face "information overload" when digesting lengthy PDFs or YouTube lectures. Furthermore, collaborative study is difficult to coordinate digitally. Existing AI chat tools (like ChatGPT) suffer from "context pollution" when managing multiple subjects and lack built-in gamification or structural data visualization.

### 2.2 Proposed Solution
Cee addresses these challenges through a dual-mode architecture:
1.  **Personal Mode:** Automatically parses PDFs and YouTube transcripts into interactive Mind Maps and provides a strictly scoped AI chat interface tied exclusively to the active document.
2.  **Group Mode (Battle Room):** A real-time multiplayer lobby where users pool their documents. The AI analyzes the collective knowledge pool and forges a competitive multiple-choice quiz, complete with synchronized arenas and live leaderboards.

---

## 3. System Architecture
The application relies on a decoupled, microservice-inspired architecture, dividing the frontend user experience and database management from the heavy AI/ML processing tasks.

### 3.1 High-Level Component Design
* **Frontend Client (React/Next.js):** Manages the UI, Framer Motion animations, Clerk authentication, and real-time polling.
* **Primary Backend (Next.js API & Prisma):** Acts as the central nervous system for state management, handling user sessions, multiplayer group syncing, and leaderboard tracking via a relational database (SQLite/PostgreSQL).
* **AI/ML Microservice (FastAPI/Python):** Dedicated to heavy computational tasks—PDF parsing, embedding generation, Vector Store management, and LLM orchestration via LlamaIndex.

### 3.2 Technology Stack
* **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide Icons, React Flow (for canvas).
* **Authentication:** Clerk.
* **Database:** Prisma ORM.
* **Backend (Python):** FastAPI, Uvicorn, Pydantic.
* **AI & RAG Framework:** LlamaIndex.
* **LLMs:**
    * *Google Gemini 1.5 Flash/Pro:* Used for rapid quiz generation and document chatting.
    * *Groq (Llama-3-70b):* Used for zero-temperature, strict JSON schema enforcement to generate Knowledge Graph nodes and edges.
* **Embeddings:** Local HuggingFace (`BAAI/bge-small-en-v1.5`) for cost-effective, private vectorization.

---

## 4. Core Modules & Implementation

### 4.1 Knowledge Extraction & Graph Generation
When a user uploads a PDF or provides a YouTube URL, the Python backend executes the `process_document` pipeline:
1.  **Ingestion:** `SimpleDirectoryReader` or `youtube_transcript_api` extracts the raw text.
2.  **Vectorization:** Text is chunked and embedded locally using the BGE-small model, then stored in LlamaIndex's local `StorageContext`.
3.  **Graph Architecture:** Groq (Llama-3-70b) is prompted with a strict JSON schema requirement to identify core entities and relationships. The structured output (`nodes` and `edges`) is sent back to the Next.js frontend to render a visual Mind Map.

### 4.2 Scoped Solo Chat (Isolated RAG)
To solve "Context Pollution" (where the AI hallucinates information from previously uploaded, unrelated PDFs), the chat module implements strict **Metadata Filtering**.
* When a session is loaded, the Next.js frontend maintains a state of `activeSessionFiles`.
* Upon querying the chat, the frontend passes both the user's question and the specific array of filenames.
* The FastAPI backend applies a `MetadataFilter` (matching the `file_name` tag) to the `VectorStoreIndex`. This acts as an "Identity Lock," physically preventing the LLM from accessing chunks outside the active study session.

### 4.3 Multiplayer Battle Rooms & Sync Engine
The group module allows multiple authenticated users to interact in real time without the overhead of WebSockets, utilizing an optimized polling architecture:
* **Room Creation & Joining:** The host generates a unique 10-character code. Users join via Clerk-authenticated API routes, creating `GroupMember` relationships in the Prisma database.
* **Collective Pooling:** Users upload PDFs independently. The Next.js API records the filenames in the shared Group table, while the Python backend stores the physical files.
* **The Sync Heartbeat:** To achieve "Kahoot-style" synchronization, the React frontend runs a cache-busting `setInterval` loop (`?t=${Date.now()}`). Every 3 seconds, client apps query the database for the `isQuizActive` boolean.
* **AI Quiz Forging:** The host clicks "Initiate." FastAPI utilizes a "Bounded Sampling" strategy—grabbing random, fair chunks from all pooled PDFs to prevent token limits—and prompts Gemini to return a strict JSON array of quiz questions.
* **Arena Transition:** The Next.js API saves the generated quiz to the database and flips `isQuizActive` to true. All connected clients instantly snap into the Battle Arena UI simultaneously.

### 4.4 Live Leaderboards
As users answer questions, local state tracks their score. Upon reaching the final question, the frontend sends a `POST` request to the Next.js leaderboard route, utilizing Prisma's `upsert` method to log the final score and toggle `isFinished`. The 3-second heartbeat continues to poll the leaderboard route, dynamically updating rankings on the "Battle Complete" screen as other users finish.

---

## 5. Key Challenges & Solutions

### 5.1 Challenge: Next.js Aggressive Caching
**Issue:** Joined members in a Battle Room could not see newly uploaded PDFs or the quiz starting unless they manually refreshed the page, as Next.js was caching the `GET` requests to save server resources.
**Solution:** Implemented a unified "Cache-Busting Heartbeat." By appending a dynamically generated timestamp parameter (`?t=${Date.now()}`) to the API fetch requests inside the `setInterval` loop, the browser was forced to bypass the cache and fetch fresh database records.

### 5.2 Challenge: Prisma Primitive Arrays (SQLite limitation)
**Issue:** While trying to store the scoped filenames for isolated RAG sessions, Prisma threw an error stating SQLite does not support `String[]` primitive lists.
**Solution:** Handled the data transformation at the application layer. The frontend joins the filename array into a comma-separated string before `POST`ing to the database, and uses `.split(',')` to reconstruct the array when fetching the session data back.

### 5.3 Challenge: LLM Context Pollution
**Issue:** The single Python backend endpoint was answering questions using the entire `/uploads` folder, mixing up subjects (e.g., answering Biology questions with History notes).
**Solution:** Engineered a robust Metadata Filter within the LlamaIndex query engine. By passing the specific filename from the frontend, the vector search is forcefully scoped, and combined with a strict behavioral System Prompt instructing the AI to refuse outside context.

---

## 6. Future Enhancements
While Cee currently operates as a fully functional MVP, the architecture is designed to scale. Future roadmap items include:
1.  **Source Citations:** Exposing LlamaIndex's `source_nodes` to the frontend UI, allowing users to click an AI-generated fact and see the exact highlighted paragraph in their original PDF.
2.  **Multimodal RAG:** Upgrading the document parsing pipeline to extract and describe images, charts, and graphs within PDFs using Gemini 1.5 Pro's vision capabilities, injecting them into the vector store alongside text.
3.  **Migration to ChromaDB/Qdrant:** Transitioning from the local `./storage` file system to a dedicated Vector Database for optimized high-dimensional retrieval across thousands of users.
4.  **Dockerization:** Creating a unified `docker-compose.yml` environment to instantly provision the Next.js frontend, FastAPI backend, and a PostgreSQL database for seamless enterprise deployment.

---

## 7. Conclusion
Cee successfully demonstrates the powerful intersection of modern web development and applied Artificial Intelligence. By solving complex state-synchronization problems and managing isolated vector retrieval pipelines, the platform elevates digital studying from a solitary, static task into an intelligent, dynamic, and collaborative multiplayer ecosystem.
