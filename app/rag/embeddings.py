from langchain_core.embeddings import Embeddings
from langchain_huggingface import HuggingFaceEmbeddings

from app.core.config import settings


class EmbeddingManager:
    """
    Creates and manages the embedding model.

    The embedding model is loaded once during application startup
    and reused throughout the application's lifetime.
    """

    def __init__(self) -> None:

        # Load the embedding model once.
        self._embedding_model = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={
                "device": settings.EMBEDDING_DEVICE,
            },
            encode_kwargs={
                "normalize_embeddings": True,
            },
        )

    def get_model(self) -> Embeddings:
        """
        Return the configured embedding model.
        """

        return self._embedding_model