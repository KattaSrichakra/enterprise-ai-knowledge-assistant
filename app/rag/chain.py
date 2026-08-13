from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate


class RAGChain:
    """
    Generates answers using the configured prompt
    template and language model.
    """

    def __init__(
        self,
        prompt: ChatPromptTemplate,
        llm: BaseChatModel,
    ) -> None:
        """
        Initialize the RAG chain.

        Args:
            prompt:
                Prompt template used to generate prompts.

            llm:
                Language model used to generate answers.
        """

        self._prompt = prompt
        self._llm = llm

    def generate(
        self,
        question: str,
        context: str,
        history: str = "",
    ) -> str:
        """
        Generate an answer using the provided
        conversation history, context, and question.
        """

        try:
            prompt_value = self._prompt.format_prompt(
                history=history,
                context=context,
                question=question,
            )

            response = self._llm.invoke(prompt_value)

            return response.content

        except Exception as e:
            raise RuntimeError(
                "Failed to generate an answer."
            ) from e