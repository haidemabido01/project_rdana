from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RDANA API"
    environment: str = "development"
    database_url: str = "sqlite:///./rdana.db"
    jwt_secret: str = "dev-only-change-this-secret-before-deploying"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    demo_mode: bool = True
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173,"
        "http://localhost:4185,http://127.0.0.1:4185"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="RDANA_",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
