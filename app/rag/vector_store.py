from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever

from app.core.config import settings
from app.rag.embeddings import EmbeddingManager


class VectorStore:
    """
    Wrapper around the Chroma vector database.
    """

    def __init__(
        self,
        embedding_manager: EmbeddingManager,
    ) -> None:

        self._vector_store = Chroma(
            collection_name=settings.VECTOR_COLLECTION_NAME,
            embedding_function=embedding_manager.get_model(),
            persist_directory=str(settings.VECTOR_DB_DIR),
        )

    def add_documents(
        self,
        documents: list[Document],
    ) -> None:
        """
        Store documents in the vector database.
        """

        try:
            self._vector_store.add_documents(documents)

        except Exception as e:
            raise RuntimeError(
                "Failed to add documents to the vector store."
            ) from e

    def get_retriever(self) -> BaseRetriever:
        """
        Return a LangChain retriever.
        """

        return self._vector_store.as_retriever(
            search_kwargs={
                "k": settings.TOP_K,
            }
        )

    def delete_collection(self) -> None:
        """
        Delete the complete collection.
        """

        try:
            self._vector_store.delete_collection()

        except Exception as e:
            raise RuntimeError(
                "Failed to delete the vector collection."
            ) from e
