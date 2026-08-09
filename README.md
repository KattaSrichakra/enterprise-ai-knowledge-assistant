# Enterprise AI Knowledge Assistant

An enterprise-style Retrieval-Augmented Generation (RAG) application built with FastAPI, LangChain, Chroma, Hugging Face embeddings, and Groq.

The application allows users to upload documents or provide public web page URLs, index their content into a vector database, and ask natural-language questions based on the indexed information.

---

## Overview

Large Language Models can generate useful answers, but they may not have access to an organization's private or domain-specific information.

This project addresses that limitation using Retrieval-Augmented Generation (RAG).

The system retrieves relevant information from user-provided documents or web pages and supplies that information as context to the LLM before generating an answer.

### What the application can do

- Upload multiple documents.
- Process TXT, PDF, DOCX, CSV, and PPTX files.
- Add public HTTP/HTTPS web pages using URLs.
- Split documents into smaller chunks.
- Generate semantic embeddings for document chunks.
- Store embeddings and document content in Chroma.
- Retrieve relevant document chunks for user questions.
- Generate answers using a Groq-hosted LLM.
- Return a grounded response when relevant information is available.
- Avoid answering from unrelated knowledge when the required information is not present in the indexed content.
- Expose the functionality through REST APIs using FastAPI.
- Provide interactive API documentation through Swagger UI.

---

## Key Features

### Multi-Source Document Ingestion

The application currently supports:

- TXT
- PDF
- DOCX
- CSV
- PPTX
- Public HTTP/HTTPS web pages

Different source types are handled through a loader-based architecture.

### Retrieval-Augmented Generation

The application follows a complete RAG workflow:

```text
                DOCUMENT INGESTION
                       |
                       v
              Source / File / URL
                       |
                       v
                 Loader Factory
                       |
                       v
               Document Loader
                       |
                       v
                Text Splitting
                       |
                       v
             Embedding Generation
                       |
                       v
                  Chroma DB
                       |
                       |
                       v
                QUERY / RETRIEVAL
                       |
                 User Question
                       |
                       v
              Query Embedding
                       |
                       v
              Similarity Search
                       |
                       v
            Relevant Document Chunks
                       |
                       v
               Context Building
                       |
                       v
                  Groq LLM
                       |
                       v
                     Answer
```

### Multiple Document Support

Documents are added to the existing vector collection rather than replacing previously indexed documents.

This allows multiple documents to contribute to the same searchable collection.

### Grounded Question Answering

When relevant information exists in the indexed content, the system retrieves that information and provides it to the LLM as context.

When relevant information cannot be found, the application can return a response indicating that there is not enough information rather than relying on unrelated information.

### Web Page Ingestion

Public HTTP/HTTPS web pages can be provided as URLs.

The page content is loaded, converted into LangChain documents, split into chunks, embedded, and stored in Chroma.

---

## Architecture

```text
                         USER
                           |
             +-------------+-------------+
             |                           |
             v                           v
       Upload Documents            Add Web Page
             |                           |
             v                           v
   POST /documents/upload       POST /documents/url
             |                           |
             +-------------+-------------+
                           |
                           v
                     RAG Pipeline
                           |
                           v
                     Loader Factory
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
        File Loader    URL Loader    Text Loader
             |             |             |
             +-------------+-------------+
                           |
                           v
                  Document Splitter
                           |
                           v
                 Embedding Manager
                           |
                           v
                      Chroma DB
                           |
                           v
                       Retriever
                           |
                           v
                       RAG Chain
                           |
                           v
                       Groq LLM
                           |
                           v
                         Answer
```

---

## RAG Workflow

### 1. Source Selection

The user provides either:

- One or more supported files, or
- A public HTTP/HTTPS web page URL.

### 2. Source Loading

The `LoaderFactory` determines which loader should process the source.

```text
Source
  |
  +-- HTTP/HTTPS URL
  |       |
  |       +--> URLLoader
  |
  +-- Supported file extension
  |       |
  |       +--> FileLoader
  |
  +-- Other text source
          |
          +--> TextLoader
```

This keeps source-specific loading logic separate from the rest of the RAG pipeline.

### 3. Document Splitting

Loaded documents are divided into smaller chunks using `RecursiveCharacterTextSplitter`.

Chunking allows the retrieval system to work with focused portions of documents instead of retrieving an entire large document.

### 4. Embedding Generation

Each document chunk is converted into a semantic vector representation using the configured embedding model.

These vectors allow the system to compare the semantic similarity between a user's question and stored document chunks.

### 5. Vector Storage

The document chunks and their embeddings are stored in Chroma.

Chroma provides the vector similarity search capability used during retrieval.

### 6. Question Processing

When the user submits a question, the retriever searches the vector database for document chunks that are semantically relevant to the question.

### 7. Context Construction

The retrieved document chunks are combined into a context that is passed to the RAG chain.

### 8. Answer Generation

The user's question and retrieved context are provided to the Groq-powered LLM.

The LLM generates the final response using the retrieved information.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Python 3.11 | Application development |
| FastAPI | REST API framework |
| Pydantic | Request and configuration validation |
| LangChain | RAG components and orchestration |
| LangChain Text Splitters | Document chunking |
| Hugging Face | Embedding model integration |
| Sentence Transformers | Semantic embedding generation |
| Chroma | Vector database |
| Groq | LLM inference |
| Uvicorn | ASGI application server |
| Docker | Containerization support |
| Git | Version control |

---

## Project Structure

```text
enterprise-ai-knowledge-assistant/
│
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── chat.py
│   │   │   ├── documents.py
│   │   │   └── health.py
│   │   └── router.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   └── exceptions.py
│   │
│   ├── database/
│   │   └── __init__.py
│   │
│   ├── llm/
│   │   ├── __init__.py
│   │   └── groq_client.py
│   │
│   ├── memory/
│   │   ├── __init__.py
│   │   └── chat_memory.py
│   │
│   ├── models/
│   │   ├── requests.py
│   │   └── responses.py
│   │
│   ├── rag/
│   │   ├── loaders/
│   │   │   ├── base_loader.py
│   │   │   ├── file_loader.py
│   │   │   ├── image_loader.py
│   │   │   ├── loader_factory.py
│   │   │   ├── text_loader.py
│   │   │   ├── url_loader.py
│   │   │   └── youtube_loader.py
│   │   │
│   │   ├── services/
│   │   │   └── ocr_service.py
│   │   │
│   │   ├── chain.py
│   │   ├── embeddings.py
│   │   ├── pipeline.py
│   │   ├── prompt.py
│   │   ├── retriever.py
│   │   ├── splitter.py
│   │   └── vector_store.py
│   │
│   └── utils/
│
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

> `image_loader.py`, `youtube_loader.py`, and `ocr_service.py` are present in the project structure but are not currently exposed through the active `LoaderFactory` ingestion flow.

---

## API Endpoints

### Health Check

```http
GET /health
```

Checks whether the API is running.

### Upload Documents

```http
POST /documents/upload
```

Accepts one or more documents using multipart form data.

Supported file types currently tested:

- TXT
- PDF
- DOCX
- CSV
- PPTX

Example response:

```json
{
  "message": "Documents uploaded successfully.",
  "documents_indexed": 1,
  "chunks_indexed": 1
}
```

### Add Web Page

```http
POST /documents/url
```

Adds a public HTTP/HTTPS webpage to the vector store.

Example request:

```json
{
  "url": "https://example.com"
}
```

Example response:

```json
{
  "message": "Web page indexed successfully.",
  "documents_indexed": 1,
  "chunks_indexed": 1
}
```

### Ask a Question

```http
POST /chat
```

Example request:

```json
{
  "question": "What is Retrieval-Augmented Generation?"
}
```

Example response:

```json
{
  "answer": "Retrieval-Augmented Generation, commonly called RAG, combines document retrieval with a language model."
}
```

---

## API Documentation

When the application is running, FastAPI provides interactive API documentation.

### Swagger UI

```text
http://127.0.0.1:8000/docs
```

### ReDoc

```text
http://127.0.0.1:8000/redoc
```

Swagger UI can be used to test the application's endpoints directly from the browser.

---

## Configuration

The application uses environment variables for configuration.

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_actual_groq_api_key
USER_AGENT=EnterpriseAIKnowledgeAssistant/1.0
```

The real `.env` file is excluded from Git through `.gitignore`.

A safe template is provided in:

```text
.env.example
```

Never commit your actual API key to GitHub.

---

## Installation

### Prerequisites

- Python 3.11
- Git
- A Groq API key

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd enterprise-ai-knowledge-assistant
```

### 2. Create a virtual environment

Windows:

```cmd
python -m venv .venv
```

### 3. Activate the virtual environment

```cmd
.venv\Scripts\activate
```

### 4. Install dependencies

```cmd
pip install -r requirements.txt
```

### 5. Configure environment variables

Create a `.env` file:

```env
GROQ_API_KEY=your_actual_groq_api_key
USER_AGENT=EnterpriseAIKnowledgeAssistant/1.0
```

### 6. Start the application

```cmd
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

---

## Example Usage

### Upload a document

Using Swagger UI:

```text
http://127.0.0.1:8000/docs
```

Select:

```text
POST /documents/upload
```

Upload the desired document and execute the request.

### Add a webpage

Use:

```text
POST /documents/url
```

with:

```json
{
  "url": "https://example.com"
}
```

### Ask a question

Use:

```text
POST /chat
```

with:

```json
{
  "question": "What is the purpose of the Example Domain webpage?"
}
```

The system retrieves the relevant webpage content and generates an answer based on the indexed information.

---

## Testing and Verification

The core application has been tested through the running FastAPI application.

### Document ingestion tests

The following source types were successfully loaded, indexed, and queried:

- TXT
- PDF
- DOCX
- CSV
- PPTX
- Public web page URL

### URL ingestion test

A public webpage was successfully indexed through:

```http
POST /documents/url
```

The API returned:

```json
{
  "message": "Web page indexed successfully.",
  "documents_indexed": 1,
  "chunks_indexed": 1
}
```

A subsequent question about the webpage successfully retrieved the indexed content.

### Grounding test

The system was tested with a question whose answer was not present in the indexed information.

Example:

```text
Question:
What is the capital of France?
```

Response:

```json
{
  "answer": "I do not have enough information to answer that question."
}
```

This demonstrates the intended RAG behavior of avoiding unsupported answers when relevant information is unavailable in the indexed content.

### Multiple document test

Multiple documents were indexed into the same Chroma collection and queried successfully.

This confirms that document ingestion uses an additive approach rather than replacing previously indexed documents.

---

## Docker

The project includes Docker configuration for containerized deployment.

### Build the Docker image

```bash
docker build -t enterprise-ai-knowledge-assistant .
```

### Run the container

```bash
docker run -p 8000:8000 --env-file .env enterprise-ai-knowledge-assistant
```

Docker support is included in the project configuration. Container deployment should be validated separately before using it as a production deployment configuration.

---

## Design Principles

The application follows several software engineering principles:

- Modular architecture
- Separation of concerns
- Dependency injection
- Environment-based configuration
- Reusable RAG pipeline
- Source-specific document loaders
- Centralized vector-store management
- Pydantic request validation
- API-level validation
- Configuration management
- Error handling at application boundaries
- Containerization support

---

## Future Enhancements

Potential improvements include:

- User authentication and authorization
- User-specific document collections
- Document listing and management
- Document deletion
- Clear/reset indexed documents functionality
- Duplicate document detection
- File-size validation
- Improved file validation
- Streaming LLM responses
- Persistent conversation memory
- Hybrid keyword and semantic retrieval
- Retrieval reranking
- Retrieval evaluation metrics
- Background document processing
- Production-grade URL security and SSRF protection
- Monitoring and structured logging
- Automated tests
- CI/CD pipeline
- Production deployment

---

## Project Status

**Core RAG application: Functional and tested**

The current implementation successfully demonstrates:

- Multi-format document ingestion
- Web-page ingestion
- Document chunking
- Semantic embedding generation
- Vector storage using Chroma
- Similarity-based retrieval
- Context-aware LLM generation
- Grounded question answering
- FastAPI REST APIs
- Swagger API documentation
- Docker configuration

The core ingestion and question-answering workflow has been tested using the running FastAPI application.