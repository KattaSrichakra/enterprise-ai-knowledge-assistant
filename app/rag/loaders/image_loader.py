from pathlib import Path

from langchain_core.documents import Document

from app.rag.loaders.base_loader import BaseLoader
from app.rag.services.ocr_service import OCRService


class ImageLoader(BaseLoader):
    """
    Loads images and extracts their text using OCR.
    """

    SUPPORTED_EXTENSIONS = {
        ".png",
        ".jpg",
        ".jpeg",
        ".tiff",
        ".tif",
        ".bmp",
    }

    def __init__(
        self,
        ocr_service: OCRService | None = None,
    ) -> None:
        """
        Initialize the image loader.

        Args:
            ocr_service:
                OCR service used to extract text from images.
        """

        self._ocr_service = (
            ocr_service
            if ocr_service is not None
            else OCRService()
        )

    def load(self, source: str) -> list[Document]:
        """
        Load an image and return its OCR text
        as a LangChain Document.
        """

        path = Path(source)

        if not path.is_file():
            raise FileNotFoundError(
                f"Image file not found: {path}"
            )

        if path.suffix.lower() not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Unsupported image format: {path.suffix}"
            )

        text = self._ocr_service.extract_text(path)

        return [
            Document(
                page_content=text,
                metadata={
                    "source": str(path),
                    "source_type": "image",
                    "file_name": path.name,
                },
            )
        ]