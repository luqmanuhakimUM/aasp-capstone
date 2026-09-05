from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Defaults to a local SQLite file so the app runs with zero external
    # services for local dev/testing. Point this at Postgres (see
    # .env.example) for anything beyond a quick local test -- pgvector's
    # SQL-side ANN search only kicks in on Postgres; SQLite falls back to
    # brute-force cosine similarity in Python (see rag_service.py).
    database_url: str = "sqlite:///./aasp_dev.db"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    storage_dir: str = "./storage"

    # Local LLM via Ollama -- no API key, no cost. Requires `ollama serve`
    # running and the model pulled (`ollama pull <model>`). See README.md.
    # 127.0.0.1 rather than "localhost" -- avoids a multi-second IPv6/IPv4
    # dual-stack resolution delay on Windows when nothing is listening yet.
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "llama3.2:3b"

    semantic_scholar_api_key: str = ""
    cors_origins: str = "http://localhost:3000"

    # --- Google OAuth (optional -- "Continue with Google" is disabled on the
    # frontend until these are set). Create a Web application OAuth client at
    # https://console.cloud.google.com/apis/credentials and add
    # {google_redirect_uri} as an authorized redirect URI. See README.md.
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"
    frontend_base_url: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def google_oauth_configured(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)


settings = Settings()
