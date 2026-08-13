from pathlib import Path

import pytesseract
from PIL import Image

from app.core.config import settings


class OCRService:
    """
    Service responsible for extracting text from images
    using the Tesseract OCR engine.
    """

    def __init__(self) -> None:
        """
        Configure the Tesseract executable path when provided.
        """

        if settings.TESSERACT_CMD is not None:
            tesseract_path = settings.TESSERACT_CMD

            if not tesseract_path.is_file():
                raise FileNotFoundError(
                    f"Tesseract executable not found: {tesseract_path}"
                )

            pytesseract.pytesseract.tesseract_cmd = str(
                tesseract_path
            )

    def extract_text(
        self,
        file_path: str | Path,
    ) -> str:
        """
        Extract text from an image file.

        Args:
            file_path:
                Path to the image file.

        Returns:
            Extracted text as a string.

        Raises:
            FileNotFoundError:
                If the image file does not exist.

            ValueError:
                If no meaningful text can be extracted.

            RuntimeError:
                If OCR processing fails.
        """

        path = Path(file_path)

        if not path.is_file():
            raise FileNotFoundError(
                f"Image file not found: {path}"
            )

        try:
            with Image.open(path) as image:
                text = pytesseract.image_to_string(
                    image
                )

        except Exception as e:
            raise RuntimeError(
                f"Failed to perform OCR on image: {path}"
            ) from e

        text = text.strip()

        if not text:
            raise ValueError(
                "No readable text was found in the image."
            )

        return text

    def extract_text_from_image(
        self,
        image: Image.Image,
    ) -> str:
        """
        Extract text directly from a PIL image.

        This is used for OCR of rendered PDF pages.
        """

        try:
            text = pytesseract.image_to_string(
                image
            )

        except Exception as e:
            raise RuntimeError(
                "Failed to perform OCR on image."
            ) from e
        return text.strip()