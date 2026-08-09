from langchain_core.documents import Document

from app.rag.loaders.base_loader import BaseLoader


class TextLoader(BaseLoader):
    """
    Converts plain text into LangChain Document objects.
    """

    def load(self, source: str) -> list[Document]:

        document = Document(
            page_content=source,
            metadata={
                "source": "text",
            },
        )

        return [document]