from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Gemini / Google AI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash-001"
    GEMINI_EMBEDDING_MODEL: str = "text-embedding-004"

    # Vertex AI (used when GEMINI_API_KEY is empty)
    GCP_PROJECT_ID: str = ""
    GCP_LOCATION: str = "us-central1"

    # Document AI
    DOCUMENT_AI_LOCATION: str = "us"          # processor region (us or eu)
    DOCUMENT_AI_FORM_PARSER_ID: str = ""      # Form Parser processor ID from GCP Console

    # PostgreSQL (Neon)
    DATABASE_URL: str

    # Neo4j AuraDB
    NEO4J_URI: str
    NEO4J_USERNAME: str = ""
    NEO4J_PASSWORD: str

    # Gmail API
    GMAIL_SENDER_EMAIL: str = ""          # the Gmail address that sends alerts
    GMAIL_CREDENTIALS_PATH: str = "gmail_credentials.json"  # OAuth2 client secrets from GCP
    GMAIL_TOKEN_PATH: str = "gmail_token.json"              # saved token (auto-refreshed)

    # Twilio (SMS)
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_FROM_NUMBER: str

    # Comma-separated default recipients for SLA breach / zoonotic alerts
    ALERT_RECIPIENTS_EMAIL: str = ""
    ALERT_RECIPIENTS_PHONE: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
