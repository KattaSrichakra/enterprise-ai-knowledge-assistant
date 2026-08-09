from functools import lru_cache

from app.llm.groq_client import GroqClient
from app.rag.chain import RAGChain
from app.rag.embeddings import EmbeddingManager
from app.rag.loaders.loader_factory import LoaderFactory
from app.rag.pipeline import RAGPipeline
from app.rag.prompt import RAG_PROMPT
from app.rag.retriever import Retriever
from app.rag.splitter import DocumentSplitter
from app.rag.vector_store import VectorStore


def create_pipeline() -> RAGPipeline:
    """
    Create and configure the complete RAG pipeline.
    """

    # -----------------------------
    # Embedding Model
    # -----------------------------
    embedding_manager = EmbeddingManager()

    # -----------------------------
    # Vector Store
    # -----------------------------
    vector_store = VectorStore(
        embedding_manager=embedding_manager,
    )

    # -----------------------------
    # Retriever
    # -----------------------------
    retriever = Retriever(
        base_retriever=vector_store.get_retriever(),
    )

    # -----------------------------
    # Language Model
    # -----------------------------
    groq_client = GroqClient()

    # -----------------------------
    # RAG Chain
    # -----------------------------
    chain = RAGChain(
        prompt=RAG_PROMPT,
        llm=groq_client.get_llm(),
    )

    # -----------------------------
    # Document Processing
    # -----------------------------
    loader_factory = LoaderFactory()

    splitter = DocumentSplitter()

    # -----------------------------
    # Pipeline
    # -----------------------------
    return RAGPipeline(
        loader_factory=loader_factory,
        splitter=splitter,
        vector_store=vector_store,
        retriever=retriever,
        chain=chain,
    )


@lru_cache
def get_pipeline() -> RAGPipeline:
    """
    Return the cached RAG pipeline.

    The pipeline is created only once during the
    application's lifetime.
    """

    return create_pipeline()


def rebuild_pipeline() -> RAGPipeline:
    """
    Rebuild the cached RAG pipeline.

    This should be called after rebuilding the
    application's knowledge base.
    """

    get_pipeline.cache_clear()

    return get_pipeline()