from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized application configuration.

    Loads configuration from the .env file,
    validates values, and provides a single
    Settings object throughout the application.
    """

    # ==========================================================
    # Application
    # ==========================================================

    APP_NAME: str = "Enterprise AI Knowledge Assistant"

    APP_VERSION: str = "1.0.0"

    ENVIRONMENT: Literal[
        "development",
        "testing",
        "production",
    ] = "development"

    # ==========================================================
    # Server
    # ==========================================================

    HOST: str = "0.0.0.0"

    PORT: int = 8000

    # ==========================================================
    # Database
    # ==========================================================

    DATABASE_URL: str

    # ==========================================================
    # Authentication / JWT
    # ==========================================================

    JWT_SECRET_KEY: str

    JWT_ALGORITHM: str = "HS256"

    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ==========================================================
    # LLM Configuration
    # ==========================================================

    GROQ_API_KEY: str

    LLM_MODEL: str = "llama-3.3-70b-versatile"

    TEMPERATURE: float = 0.2

    # ==========================================================
    # Embedding Configuration
    # ==========================================================

    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"

    EMBEDDING_DEVICE: str = "cpu"

    # ==========================================================
    # RAG Configuration
    # ==========================================================

    CHUNK_SIZE: int = 1000

    CHUNK_OVERLAP: int = 200

    TOP_K: int = 5

    VECTOR_COLLECTION_NAME: str = "knowledge_base"

    # ==========================================================
    # Storage Directories
    # ==========================================================

    DATA_DIR: Path = Path("data")

    VECTOR_DB_DIR: Path = Path("vector_db")

    DATABASE_DIR: Path = Path("database")

    LOG_DIR: Path = Path("logs")

    # ==========================================================
    # Upload Configuration
    # ==========================================================

    MAX_UPLOAD_SIZE_MB: int = 50

    # ==========================================================
    # Logging
    # ==========================================================

    LOG_LEVEL: Literal[
        "DEBUG",
        "INFO",
        "WARNING",
        "ERROR",
        "CRITICAL",
    ] = "INFO"

    # ==========================================================
    # Validators
    # ==========================================================

    @field_validator("PORT")
    @classmethod
    def validate_port(cls, value: int) -> int:
        if not (1 <= value <= 65535):
            raise ValueError(
                "PORT must be between 1 and 65535."
            )

        return value

    @field_validator("TOP_K")
    @classmethod
    def validate_top_k(cls, value: int) -> int:
        if value <= 0:
            raise ValueError(
                "TOP_K must be greater than 0."
            )

        return value

    @field_validator("CHUNK_SIZE")
    @classmethod
    def validate_chunk_size(cls, value: int) -> int:
        if value <= 0:
            raise ValueError(
                "CHUNK_SIZE must be greater than 0."
            )

        return value

    @field_validator("CHUNK_OVERLAP")
    @classmethod
    def validate_chunk_overlap(cls, value: int) -> int:
        if value < 0:
            raise ValueError(
                "CHUNK_OVERLAP cannot be negative."
            )

        return value

    @field_validator("MAX_UPLOAD_SIZE_MB")
    @classmethod
    def validate_upload_size(cls, value: int) -> int:
        if value <= 0:
            raise ValueError(
                "MAX_UPLOAD_SIZE_MB must be greater than 0."
            )

        return value

    @field_validator("JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    @classmethod
    def validate_jwt_expiration(cls, value: int) -> int:
        if value <= 0:
            raise ValueError(
                "JWT_ACCESS_TOKEN_EXPIRE_MINUTES must be greater than 0."
            )

        return value

    # ==========================================================
    # Pydantic Settings Configuration
    # ==========================================================

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """
    Return a cached Settings object.

    The Settings object is created only once during
    the application's lifetime.
    """

    return Settings()


settings = get_settings()