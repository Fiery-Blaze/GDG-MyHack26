import asyncio
import base64
import os
from email.mime.text import MIMEText

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from twilio.rest import Client as TwilioClient

from app.core.config import settings
from app.core.gemini import get_client

_GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


def _get_gmail_service():
    """
    Load OAuth2 credentials from token.json (auto-refreshes if expired).
    Run `python scripts/gmail_auth.py` once to generate the initial token.
    """
    creds = None
    token_path = settings.GMAIL_TOKEN_PATH
    creds_path = settings.GMAIL_CREDENTIALS_PATH

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, _GMAIL_SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            # Persist the refreshed token
            with open(token_path, "w") as f:
                f.write(creds.to_json())
        else:
            raise RuntimeError(
                f"Gmail token not found or invalid. "
                f"Run `python scripts/gmail_auth.py` to authorise the app."
            )

    return build("gmail", "v1", credentials=creds)


def _get_twilio() -> TwilioClient:
    return TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def get_default_recipients() -> list[dict]:
    """
    Reads ALERT_RECIPIENTS_EMAIL and ALERT_RECIPIENTS_PHONE from config.
    Returns a list of {email?, phone?} dicts suitable for notify_recipients().
    """
    emails = [e.strip() for e in settings.ALERT_RECIPIENTS_EMAIL.split(",") if e.strip()]
    phones = [p.strip() for p in settings.ALERT_RECIPIENTS_PHONE.split(",") if p.strip()]
    recipients: list[dict] = []
    for i, email in enumerate(emails):
        r: dict = {"email": email}
        if i < len(phones):
            r["phone"] = phones[i]
        recipients.append(r)
    for i in range(len(emails), len(phones)):
        recipients.append({"phone": phones[i]})
    return recipients


async def generate_alert_message(raw: str) -> str:
    prompt = (
        "Rewrite this alert as a clear, concise 2-sentence notification "
        f"for a zoo coordinator:\n{raw}"
    )
    response = await get_client().aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )
    return response.text.strip()


def _build_raw_email(to: str, subject: str, body: str) -> str:
    """Encode a plain-text email as a base64url string for the Gmail API."""
    msg = MIMEText(body)
    msg["to"] = to
    msg["from"] = settings.GMAIL_SENDER_EMAIL
    msg["subject"] = subject
    return base64.urlsafe_b64encode(msg.as_bytes()).decode()


def _gmail_send_sync(to: str, subject: str, body: str) -> None:
    service = _get_gmail_service()
    raw = _build_raw_email(to, subject, body)
    service.users().messages().send(
        userId="me", body={"raw": raw}
    ).execute()


async def send_email(to: str, subject: str, body: str) -> None:
    """Send via Gmail API (runs sync SDK in a thread to stay non-blocking)."""
    await asyncio.to_thread(_gmail_send_sync, to, subject, body)


async def send_sms(to: str, body: str) -> None:
    client = _get_twilio()
    await asyncio.to_thread(
        client.messages.create,
        body=body,
        from_=settings.TWILIO_FROM_NUMBER,
        to=to,
    )


async def notify_recipients(
    recipients: list[dict], subject: str, message: str
) -> list[dict]:
    """Send email and/or SMS to each recipient. Returns a list of sent-channel records."""
    sent = []
    for r in recipients:
        if r.get("email"):
            await send_email(r["email"], subject, message)
            sent.append({"channel": "email", "to": r["email"]})
        if r.get("phone"):
            await send_sms(r["phone"], message)
            sent.append({"channel": "sms", "to": r["phone"]})
    return sent
