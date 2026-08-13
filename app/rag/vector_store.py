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
            persist_directory=str(
                settings.VECTOR_DB_DIR
            ),
        )

    def add_documents(
        self,
        documents: list[Document],
    ) -> None:
        """
        Store documents in the vector database.
        """

        if not documents:
            raise ValueError(
                "At least one document must be provided."
            )

        try:
            self._vector_store.add_documents(
                documents
            )

        except Exception as e:
            raise RuntimeError(
                "Failed to add documents to the vector store."
            ) from e

    def get_retriever(
    self,
    workspace_id: int | None = None,
    document_id: int | None = None,
) -> BaseRetriever:
        """
        Return a LangChain retriever.

        When workspace_id is provided, retrieval is restricted
        to chunks belonging to that workspace.
        """

        search_kwargs: dict[str, object] = {
            "k": settings.TOP_K,
        }

        if workspace_id is not None and document_id is not None:
            search_kwargs["filter"] = {
                "$and": [
                    {
                        "workspace_id": workspace_id,
                    },
                    {
                        "document_id": document_id,
                    },
                ]
            }
        elif workspace_id is not None:
            search_kwargs["filter"] = {
                "workspace_id": workspace_id,
         }

        elif document_id is not None:
            search_kwargs["filter"] = {
                "document_id": document_id,
    }

        return self._vector_store.as_retriever(
            search_kwargs=search_kwargs,
        )

    def delete_document(
        self,
        workspace_id: int,
        document_id: int,
    ) -> None:
        """ Delete all vector-store chunks belonging to a document.
        """

        try:
            self._vector_store.delete(
                where={
                    "$and": [
                        {
                            "workspace_id": workspace_id,
                        },
                        {
                            "document_id": document_id,
                        },
                    ],
                }
            )

        except Exception as e:
            raise RuntimeError(
                "Failed to delete document from the vector store."
            ) from e

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
