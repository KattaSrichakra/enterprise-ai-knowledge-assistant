from pathlib import Path

from app.rag.loaders.base_loader import BaseLoader
from app.rag.loaders.file_loader import FILE_LOADER_MAPPING, FileLoader
from app.rag.loaders.text_loader import TextLoader
from app.rag.loaders.url_loader import URLLoader


class LoaderFactory:
    """
    Returns the appropriate loader for a given source.
    """

    def __init__(self) -> None:

        self._file_loader = FileLoader()
        self._text_loader = TextLoader()
        self._url_loader = URLLoader()

    def get_loader(
        self,
        source: str,
    ) -> BaseLoader:
        """
        Return the appropriate loader based on the source.
        """

        if source.startswith(("http://", "https://")):
            return self._url_loader

        if Path(source).suffix.lower() in FILE_LOADER_MAPPING:
            return self._file_loader

        return self._text_loader