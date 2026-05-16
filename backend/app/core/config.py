from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Gemini / Google AI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash-001"
    GEMINI_EMBEDDING_MODEL: str = "text-embedding-004"

    # Vertex AI (used when GEMINI_API_KEY is empty)
    GCP_PROJECT_ID: str = ""
    GCP_LOCATION: str = "us-central1"

    # PostgreSQL (Neon)
    DATABASE_URL: str

    # Neo4j AuraDB
    NEO4J_URI: str
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str

    # Alerts
    SENDGRID_API_KEY: str
    SENDGRID_FROM_EMAIL: str = "alerts@arkflow.app"
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_FROM_NUMBER: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
