import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in current working dir, backend dir, or parent dirs
current_dir = Path(__file__).resolve().parent
for env_candidate in [
    current_dir / ".env",
    current_dir.parent / ".env",
    Path.cwd() / ".env",
    Path.cwd() / "backend" / ".env",
]:
    if env_candidate.exists():
        load_dotenv(dotenv_path=env_candidate)
        break
else:
    load_dotenv()

# Configuration settings for Google Gemini API
GEMINI_API_KEY: str = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
MAX_FILE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
MAX_TEXT_CHAR_LIMIT: int = 500_000           # ~100k words
CHUNK_WORD_THRESHOLD: int = 4000            # Split & synthesize if longer than this


def is_gemini_configured() -> bool:
    """Return True if a valid GEMINI_API_KEY is configured."""
    return bool(
        GEMINI_API_KEY
        and len(GEMINI_API_KEY) > 5
        and not GEMINI_API_KEY.startswith("your_")
    )
