from langchain_core.language_models.chat_models import BaseChatModel
from langchain_groq import ChatGroq

from app.core.config import settings


class GroqClient:
    """
    Creates and manages the Groq chat model.
    """

    def __init__(self) -> None:

        try:
            self._llm = ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model=settings.LLM_MODEL,
                temperature=settings.TEMPERATURE,
            )

        except Exception as e:
            raise RuntimeError(
                "Failed to initialize the Groq client."
            ) from e

    def get_llm(self) -> BaseChatModel:
        """
        Return the configured chat model.
        """

        return self._llm