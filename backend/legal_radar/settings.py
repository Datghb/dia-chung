"""Application settings loaded from environment variables."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration from environment variables."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = Field(default="development", alias="APP_ENV")
    frontend_origin: str = Field(
        default="https://diachung.dpdns.org,http://localhost:3000,http://localhost:3001",
        alias="FRONTEND_ORIGIN",
    )

    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    google_api_key: str | None = Field(default=None, alias="GOOGLE_API_KEY")
    google_api_key_1: str | None = Field(default=None, alias="GOOGLE_API_KEY_1")
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    openrouter_api_key: str | None = Field(default=None, alias="OPENROUTER_API_KEY")
    tokenrouter_api_key: str | None = Field(default=None, alias="TOKENROUTER_API_KEY")
    brightdata_api_key: str | None = Field(default=None, alias="BRIGHTDATA_API_KEY")
    tokenrouter_model: str = Field(
        default="google/gemini-3-flash-preview", alias="TOKENROUTER_MODEL"
    )
    tokenrouter_base_url: str = Field(
        default="https://api.tokenrouter.com/v1", alias="TOKENROUTER_BASE_URL"
    )

    youtube_api_key: str | None = Field(default=None, alias="YOUTUBE_API_KEY")

    data_dir: str = Field(default="../data", alias="DATA_DIR")
    runs_dir: str = Field(default="../runs", alias="RUNS_DIR")


def get_settings() -> Settings:
    """Get application settings instance."""
    return Settings()
