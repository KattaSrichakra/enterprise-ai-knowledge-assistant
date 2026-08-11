from collections.abc import Generator
from functools import lru_cache

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.llm.groq_client import GroqClient
from app.models.user import User
from app.rag.chain import RAGChain
from app.rag.embeddings import EmbeddingManager
from app.rag.loaders.loader_factory import LoaderFactory
from app.rag.pipeline import RAGPipeline
from app.rag.prompt import RAG_PROMPT
from app.rag.retriever import Retriever
from app.rag.splitter import DocumentSplitter
from app.rag.vector_store import VectorStore


# ==========================================================
# Database Dependency
# ==========================================================

def get_database() -> Generator[Session, None, None]:
    """
    Provide a database session to FastAPI endpoints.
    """

    yield from get_db()


# ==========================================================
# RAG Pipeline
# ==========================================================

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
    retriever = Retriever(vector_store=vector_store,)

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


# ==========================================================
# Authentication
# ==========================================================

security = HTTPBearer(
    auto_error=False,
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        security
    ),
    db: Session = Depends(get_database),
) -> User:
    """
    Return the currently authenticated user.

    Raises:
        HTTPException:
            If the authorization credentials are missing,
            invalid, expired, or belong to an inactive user.
    """

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials are required.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    token = credentials.credentials

    try:
        payload = decode_access_token(token)

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        ) from exc

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    try:
        user_id = int(user_id)

    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        ) from exc

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    return user