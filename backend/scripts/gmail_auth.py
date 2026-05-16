"""
One-time OAuth2 authorisation for the Gmail API.

Run this script once from the backend directory:
    python scripts/gmail_auth.py

What it does:
  1. Reads gmail_credentials.json (downloaded from GCP Console > APIs & Services > Credentials)
  2. Opens a browser for you to approve Gmail send access
  3. Saves the token to gmail_token.json

After this, the app refreshes the token automatically — you never need to run this again
unless you revoke access or delete gmail_token.json.

Prerequisites:
  - Gmail API enabled in your GCP project
  - OAuth 2.0 Client ID created (Application type: Desktop app)
  - credentials.json downloaded and placed at the repo root (or GMAIL_CREDENTIALS_PATH in .env)
"""
import os
import sys

# Run from backend/ so relative paths match what the app expects
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from google_auth_oauthlib.flow import InstalledAppFlow
from app.core.config import settings

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


def main():
    creds_path = settings.GMAIL_CREDENTIALS_PATH
    token_path = settings.GMAIL_TOKEN_PATH

    if not os.path.exists(creds_path):
        print(f"ERROR: {creds_path} not found.")
        print("Download it from GCP Console > APIs & Services > Credentials > your OAuth 2.0 Client ID.")
        sys.exit(1)

    flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
    creds = flow.run_local_server(port=0)

    with open(token_path, "w") as f:
        f.write(creds.to_json())

    print(f"Token saved to {token_path}. The app will refresh it automatically going forward.")


if __name__ == "__main__":
    main()
