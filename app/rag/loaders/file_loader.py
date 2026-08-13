from pathlib import Path
from app.rag.loaders.pdf_loader import PDFLoader
from langchain_community.document_loaders import (
    CSVLoader,
    TextLoader as LangChainTextLoader,
    UnstructuredPowerPointLoader,
    UnstructuredWordDocumentLoader,
)
from langchain_core.documents import Document

from app.rag.loaders.base_loader import BaseLoader


FILE_LOADER_MAPPING = {
    ".doc": UnstructuredWordDocumentLoader,
    ".docx": UnstructuredWordDocumentLoader,
    ".txt": lambda path: LangChainTextLoader(
        path,
        encoding="utf-8",
    ),
    ".md": lambda path: LangChainTextLoader(
        path,
        encoding="utf-8",
    ),
    ".csv": CSVLoader,
    ".ppt": UnstructuredPowerPointLoader,
    ".pptx": UnstructuredPowerPointLoader,
}


class FileLoader(BaseLoader):
    """
    Loads supported files and converts them
    into LangChain Document objects.
    """

    def load(self, source: str) -> list[Document]:
        """
        Load a supported file and return
        LangChain Document objects.
        """

        file_path = Path(source)

        if not file_path.exists():
            raise FileNotFoundError(
                f"File not found: {file_path}"
            )

        if not file_path.is_file():
            raise ValueError(
                f"Source is not a file: {file_path}"
            )

        extension = file_path.suffix.lower()

        if extension not in FILE_LOADER_MAPPING:
            raise ValueError(
                f"Unsupported file type '{extension}'. "
                f"Supported types: "
                f"{', '.join(FILE_LOADER_MAPPING.keys())}"
            )

        loader_factory = FILE_LOADER_MAPPING[extension]

        loader = loader_factory(
            str(file_path)
        )

        try:
            documents = loader.load()

        except Exception as e:
            raise RuntimeError(
                f"Failed to load file: {file_path}"
            ) from e

        return documents