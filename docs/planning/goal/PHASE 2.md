# Phase 2: RAG & Enterprise AI Intelligence Engine

This document outlines the detailed architecture and implementation steps completed during Phase 2 of the AI Meeting Intelligence System. Phase 2 focused on transforming raw meeting transcripts into a highly intelligent, stateful Retrieval-Augmented Generation (RAG) system capable of answering contextual queries with accurate citations and confidence scores.

## Architecture Overview

Phase 2 was executed sequentially across 10 strict enterprise-grade steps, isolating responsibilities into distinct modular services across the Node.js/Express backend and the React/Vite frontend.

### Step 1: Qdrant Environment Setup
- **Objective:** Establish the foundation for the Vector Database.
- **Implementations:**
  - Integrated the official `@qdrant/js-client-rest` SDK.
  - Built a resilient `qdrantClient.js` service with connection retries and error handling.
  - Exposed `/api/ai/health` to monitor vector database connectivity and collection availability.

### Step 2: Smart Transcript Chunking Engine
- **Objective:** Break down monolithic Whisper transcripts into semantically meaningful, overlapping segments.
- **Implementations:**
  - Designed the `chunkingService.js` to parse raw transcript formats.
  - Implemented token-aware text splitting strategies utilizing overlapping sliding windows to preserve context across chunk boundaries.
  - Attached rich metadata to every chunk (e.g., `meetingId`, `speaker`, `startTime`, `endTime`) to enable future filtering.

### Step 3: Embedding Pipeline
- **Objective:** Convert text chunks into high-dimensional vector representations.
- **Implementations:**
  - Integrated local Ollama API utilizing the `nomic-embed-text` embedding model.
  - Created `embeddingService.js` to process arrays of text chunks concurrently or sequentially with timeout protections.
  - Standardized embedding payloads for Qdrant ingestion.

### Step 4: Enterprise Qdrant Indexing Pipeline
- **Objective:** Persist vector embeddings and their metadata into Qdrant for rapid similarity search.
- **Implementations:**
  - Built `indexingService.js` to handle batch upserts into Qdrant collections.
  - Mapped critical payload parameters ensuring `speaker`, `meetingId`, and `timestamp` fields are indexed as filterable metadata within Qdrant.

### Step 5: Enterprise Retrieval Engine
- **Objective:** Execute vector similarity searches against Qdrant to find relevant historical meeting chunks based on a user's question.
- **Implementations:**
  - Developed `retrievalService.js` to convert incoming user questions into vectors.
  - Implemented metadata filtering (e.g., searching only within a specific `meetingId`).
  - Implemented `rankingService.js` to sort and threshold `similarityScores` ensuring only high-quality context is returned.

### Step 6: Enterprise Prompt Orchestration Engine
- **Objective:** Dynamically construct structured prompts injecting the retrieved context before sending it to the LLM.
- **Implementations:**
  - Created `promptBuilderService.js` using strict templating logic.
  - Formatted retrieved chunks into a clean, stringified layout (Speaker, Time, Text) preventing LLM confusion.
  - Enforced system instructions dictating that the AI must *only* answer based on provided context, minimizing hallucinations.

### Step 7: Enterprise AI Generation Engine
- **Objective:** Orchestrate the LLM (Llama 3.1) to generate the final response and calculate diagnostic metrics.
- **Implementations:**
  - Configured `ollamaClient.js` for robust generation requests using an `AbortController`.
  - Built `confidenceService.js` utilizing heuristic algorithms combining average Qdrant similarity scores and chunk density to output a 0-100% confidence rating.
  - Developed `citationService.js` to strictly map the LLM's response back to the original source chunks provided by the Retriever.
  - Formatted a unified JSON payload (`answer`, `citations`, `confidence`, `metadata`).

### Step 8: Enterprise AI Gateway (Chat Orchestrator)
- **Objective:** Unify Steps 1-7 into a single, cohesive REST endpoint hiding complexity from the frontend.
- **Implementations:**
  - Built `chatOrchestratorService.js` to chain the pipeline: Validate -> Embed Query -> Retrieve -> Build Prompt -> Generate.
  - Exposed exactly one endpoint for the frontend: `POST /api/ai/chat`.

### Step 9: Enterprise React AI Chat Workspace
- **Objective:** Provide a beautiful, interactive, user-facing chat application utilizing the new AI Gateway.
- **Implementations:**
  - Developed an entirely stateless React chat interface (`AIChatPage.jsx`, `ChatLayout.jsx`, `ChatWindow.jsx`).
  - Integrated `react-markdown` and `remark-gfm` to elegantly render the LLM's Markdown output (tables, code blocks, bolding).
  - Built custom UI components for `ConfidenceBadge` and `CitationCard` allowing users to see exactly which meeting segments generated the answer.
  - Implemented `useAIChat.js` for strict state management (loading skeletons, auto-scroll, error handling).

### Step 10: Enterprise Conversation Intelligence Engine
- **Objective:** Upgrade the AI Gateway to support stateful conversational memory (follow-up questions).
- **Implementations:**
  - Introduced the `Conversation` MongoDB schema to persist chat histories via a unique `sessionId`.
  - Built `windowManagerService.js` implementing a rolling memory window (e.g., retaining the last 10 messages or max 4000 characters) to prevent LLM context-overflow.
  - Developed `contextInjectionService.js` which dynamically prepends historical chat context onto the current user query, enabling the LLM to seamlessly resolve pronouns and follow-up topics natively.
  - Integrated this logic via `processConversation()` exposed at `POST /api/ai/conversation`.

## Conclusion of Phase 2
The system now represents a complete, modular, enterprise-grade RAG pipeline. The frontend is seamlessly decoupled from the heavy backend orchestration, and the LLM is tightly constrained to providing verifiable, cited answers augmented by long-term conversational memory.
