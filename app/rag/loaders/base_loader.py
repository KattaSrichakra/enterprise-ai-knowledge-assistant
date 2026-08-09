from abc import ABC, abstractmethod

from langchain_core.documents import Document


class BaseLoader(ABC):
    """
    Abstract base class for all document loaders.

    Every document loader must implement the load()
    method and return LangChain Document objects.
    """

    @abstractmethod
    def load(self, source: str) -> list[Document]:
        """
        Load data from the given source and
        return LangChain Document objects.
        """
        pass