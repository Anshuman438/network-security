import json
from functools import lru_cache
from typing import Any
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Spectre"
    api_prefix: str = "/api"
    environment: str = "development"
    database_url: str = "sqlite:///./mini_siem.db"
    jwt_secret_key: str = Field(default="change-me-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 12
    cors_origins: Any = "*"
    max_upload_bytes: int = 2 * 1024 * 1024
    allowed_upload_extensions: set[str] = {".json", ".csv", ".txt", ".log"}
    auto_create_tables: bool = True

    def get_cors_origins(self) -> list[str]:
        val = self.cors_origins
        if isinstance(val, list):
            return [str(x).strip() for x in val]
        if isinstance(val, str):
            s = val.strip()
            if s.startswith("[") and s.endswith("]"):
                try:
                    return json.loads(s)
                except Exception:
                    pass
            return [x.strip() for x in s.split(",") if x.strip()]
        return ["*"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
