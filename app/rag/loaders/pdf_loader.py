from pathlib import Path

import pypdfium2 as pdfium
from pypdf import PdfReader
from langchain_core.documents import Document

from app.rag.loaders.base_loader import BaseLoader
from app.rag.services.ocr_service import OCRService


class PDFLoader(BaseLoader):
    """
    Loads PDF documents.

    Text-based pages are extracted directly.
    Scanned pages are rendered as images and processed
    through OCR.
    """

    def __init__(
        self,
        ocr_service: OCRService | None = None,
    ) -> None:
        """
        Initialize the PDF loader.
        """

        self._ocr_service = (
            ocr_service
            if ocr_service is not None
            else OCRService()
        )

    def load(self, source: str) -> list[Document]:
        """
        Load a PDF and extract text from every page.

        Text-based pages use native PDF text extraction.
        Pages without meaningful text use OCR.
        """

        file_path = Path(source)

        if not file_path.exists():
            raise FileNotFoundError(
                f"PDF file not found: {file_path}"
            )

        if not file_path.is_file():
            raise ValueError(
                f"Source is not a file: {file_path}"
            )

        if file_path.suffix.lower() != ".pdf":
            raise ValueError(
                f"Unsupported PDF source: {file_path}"
            )

        pdf = None

        try:
            reader = PdfReader(str(file_path))
            pdf = pdfium.PdfDocument(str(file_path))

            documents: list[Document] = []

            for page_index, page in enumerate(reader.pages):
                page_number = page_index + 1

                text = (page.extract_text() or "").strip()

                if text:
                    documents.append(
                        Document(
                            page_content=text,
                            metadata={
                                "source": str(file_path),
                                "source_type": "pdf",
                                "file_name": file_path.name,
                                "page": page_number,
                                "extraction_method": "text",
                            },
                        )
                    )
                    continue

                pdf_page = pdf[page_index]

                bitmap = pdf_page.render(
                    scale=2.0,
                )

                image = bitmap.to_pil()

                try:
                    ocr_text = (
                        self._ocr_service.extract_text_from_image(
                            image
                        )
                    )
                finally:
                    image.close()

                if ocr_text:
                    documents.append(
                        Document(
                            page_content=ocr_text,
                            metadata={
                                "source": str(file_path),
                                "source_type": "pdf",
                                "file_name": file_path.name,
                                "page": page_number,
                                "extraction_method": "ocr",
                            },
                        )
                    )

            if not documents:
                raise ValueError(
                    "No readable text was found in the PDF."
                )

            return documents

        except (FileNotFoundError, ValueError):
            raise

        except Exception as e:
            raise RuntimeError(
                f"Failed to load PDF: {file_path}"
            ) from e

        finally:
            if pdf is not None:
                pdf.close()