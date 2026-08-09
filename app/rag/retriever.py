from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever


class Retriever:
    """
    Retrieves relevant documents using a LangChain retriever.
    """

    def __init__(
        self,
        base_retriever: BaseRetriever,
    ) -> None:
        """
        Initialize the retriever.

        Args:
            base_retriever: LangChain retriever implementation.
        """

        self._retriever = base_retriever

    def retrieve(
        self,
        query: str,
    ) -> list[Document]:
        """
        Retrieve the most relevant documents
        for the given query.

        Args:
            query: User question.

        Returns:
            List of relevant documents.
        """

        try:
            return self._retriever.invoke(query)

        except Exception as e:
            raise RuntimeError(
                "Failed to retrieve relevant documents."
            ) from e