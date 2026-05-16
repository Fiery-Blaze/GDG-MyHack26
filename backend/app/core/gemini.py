from google import genai
from app.core.config import settings

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        if settings.GCP_PROJECT_ID:
            # Vertex AI — uses Application Default Credentials + GCP billing
            _client = genai.Client(
                vertexai=True,
                project=settings.GCP_PROJECT_ID,
                location=settings.GCP_LOCATION,
            )
        else:
            # API key fallback (free tier — may have regional restrictions)
            _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client
