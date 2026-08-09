from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings


class DocumentSplitter:
    """
    Splits LangChain documents into smaller chunks
    suitable for embedding and retrieval.
    """

    def __init__(self) -> None:
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
            separators=[
                "\n\n",
                "\n",
                ". ",
                " ",
                "",
            ],
        )

    def split(
        self,
        documents: list[Document],
    ) -> list[Document]:
        """
        Split a list of LangChain documents into chunks.
        """

        return self._splitter.split_documents(documents)