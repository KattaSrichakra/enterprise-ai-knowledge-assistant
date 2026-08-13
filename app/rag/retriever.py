from langchain_core.documents import Document

from app.rag.vector_store import VectorStore


class Retriever:
    """
    Retrieves relevant documents using the vector store.

    Retrieval can optionally be restricted to a specific
    workspace.
    """

    def __init__(
        self,
        vector_store: VectorStore,
    ) -> None:
        """
        Initialize the retriever.

        Args:
            vector_store:
                Vector store used to create workspace-aware
                LangChain retrievers.
        """

        self._vector_store = vector_store

    def retrieve(
    self,
    query: str,
    workspace_id: int | None = None,
    document_id: int | None = None,
) -> list[Document]:
        """
        Retrieve the most relevant documents for a query.

        Args:
            query:
                User question.

            workspace_id:
                Optional workspace ID used to restrict retrieval.

        Returns:
            List of relevant documents.
        """

        if not query.strip():
            raise ValueError(
                "Query cannot be empty."
            )

        try:
            retriever = self._vector_store.get_retriever(
                workspace_id=workspace_id,
                document_id=document_id,
            )

            return retriever.invoke(query)

        except Exception as e:
            raise RuntimeError(
                "Failed to retrieve relevant documents."
            ) from e