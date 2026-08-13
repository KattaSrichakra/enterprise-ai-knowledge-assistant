from urllib.parse import urlparse

from app.core.config import settings

from langchain_community.document_loaders import WebBaseLoader
from langchain_core.documents import Document

from app.rag.loaders.base_loader import BaseLoader


class URLLoader(BaseLoader):
    """
    Loads web page content into LangChain Document objects.
    """

    def load(self, source: str) -> list[Document]:
        """
        Load content from a valid HTTP or HTTPS URL.
        """

        parsed = urlparse(source)

        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.netloc
        ):
            raise ValueError(
                "URL must start with http:// or https://"
            )

        try:
            loader = WebBaseLoader(
                web_paths=[source],
                header_template={"User-Agent": settings.USER_AGENT,},
            )

            documents = loader.load()

            if not documents:
                raise ValueError(
                    "No content was found at the provided URL."
                )

            return documents

        except ValueError:
            raise

        except Exception as e:
            raise RuntimeError(
                f"Failed to load URL: {source}"
            ) from e