from urllib.parse import parse_qs, urlparse

from langchain_core.documents import Document
from youtube_transcript_api import YouTubeTranscriptApi

from app.rag.loaders.base_loader import BaseLoader


class YouTubeLoader(BaseLoader):
    """
    Loads transcripts from YouTube videos and converts
    them into LangChain Document objects.
    """

    def __init__(self) -> None:
        """
        Initialize the YouTube transcript API client.
        """

        self._api = YouTubeTranscriptApi()

    @staticmethod
    def is_youtube_url(source: str) -> bool:
        """
        Return True when the source is a supported YouTube URL.
        """

        try:
            YouTubeLoader._extract_video_id(source)
            return True

        except ValueError:
            return False
    @staticmethod
    def _extract_video_id(source: str) -> str:
        """
        Extract the YouTube video ID from a supported URL.
        """

        parsed = urlparse(source)

        if parsed.scheme not in {"http", "https"}:
            raise ValueError(
                "YouTube URL must start with http:// or https://"
            )

        hostname = parsed.netloc.lower().split(":")[0]

        if hostname in {"youtube.com", "www.youtube.com"}:
            if parsed.path == "/watch":
                video_id = parse_qs(
                    parsed.query
                ).get("v", [None])[0]

            elif parsed.path.startswith("/shorts/"):
                video_id = parsed.path.split(
                    "/shorts/",
                    1,
                )[1].split("/", 1)[0]

            elif parsed.path.startswith("/embed/"):
                video_id = parsed.path.split(
                    "/embed/",
                    1,
                )[1].split("/", 1)[0]

            else:
                video_id = None

        elif hostname == "youtu.be":
            video_id = parsed.path.lstrip(
                "/"
            ).split("/", 1)[0]

        else:
            video_id = None

        if not video_id:
            raise ValueError(
                "Invalid YouTube URL. "
                "Use a standard YouTube video URL."
            )

        return video_id

    def load(self, source: str) -> list[Document]:
        """
        Load the transcript of a YouTube video.
        """

        video_id = self._extract_video_id(source)

        try:
            transcript = self._api.fetch(
                video_id,
                languages=("en",),
            )

            snippets = [
                snippet.text.strip()
                for snippet in transcript
                if snippet.text.strip()
            ]

            if not snippets:
                raise ValueError(
                    "No readable transcript was found "
                    "for the YouTube video."
                )

            text = "\n".join(snippets)

            return [
                Document(
                    page_content=text,
                    metadata={
                        "source": source,
                        "source_type": "youtube",
                        "video_id": video_id,
                        "language": transcript.language_code,
                        "is_generated": transcript.is_generated,
                    },
                )
            ]

        except ValueError:
            raise

        except Exception as e:
            raise RuntimeError(
                f"Failed to load YouTube transcript: {source}"
            ) from e