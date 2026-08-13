from pathlib import Path

from app.rag.loaders.base_loader import BaseLoader
from app.rag.loaders.excel_loader import ExcelLoader
from app.rag.loaders.file_loader import FILE_LOADER_MAPPING, FileLoader
from app.rag.loaders.image_loader import ImageLoader
from app.rag.loaders.pdf_loader import PDFLoader
from app.rag.loaders.text_loader import TextLoader
from app.rag.loaders.url_loader import URLLoader
from app.rag.loaders.youtube_loader import YouTubeLoader


class LoaderFactory:
    """
    Returns the appropriate loader for a given source.
    """

    IMAGE_EXTENSIONS = {
        ".png",
        ".jpg",
        ".jpeg",
        ".tiff",
        ".tif",
        ".bmp",
    }

    @classmethod
    def is_supported_file(cls, source: str) -> bool:
        """
        Return True when the source is a supported local file.
        """

        extension = Path(source).suffix.lower()

        return (
            extension == ".pdf"
            or extension in cls.IMAGE_EXTENSIONS
            or extension in ExcelLoader.SUPPORTED_EXTENSIONS
            or extension in FILE_LOADER_MAPPING)
    def __init__(self) -> None:
        self._file_loader = FileLoader()
        self._image_loader = ImageLoader()
        self._pdf_loader = PDFLoader()
        self._excel_loader = ExcelLoader()
        self._youtube_loader = YouTubeLoader()
        self._text_loader = TextLoader()
        self._url_loader = URLLoader()

    def get_loader(
        self,
        source: str,
    ) -> BaseLoader:
        """
        Return the appropriate loader based on the source.
        """

        if YouTubeLoader.is_youtube_url(source):
            return self._youtube_loader

        if source.startswith(("http://", "https://")):
            return self._url_loader

        extension = Path(source).suffix.lower()

        if extension == ".pdf":
            return self._pdf_loader

        if extension in self.IMAGE_EXTENSIONS:
            return self._image_loader

        if extension in ExcelLoader.SUPPORTED_EXTENSIONS:
            return self._excel_loader

        if extension in FILE_LOADER_MAPPING:
            return self._file_loader

        return self._text_loader