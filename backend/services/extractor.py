import io
import re
from typing import Optional
from pydantic import BaseModel
import pymupdf
from config import MAX_FILE_SIZE_BYTES, MAX_TEXT_CHAR_LIMIT


class DocumentExtractionError(Exception):
    """Custom exception for user-facing extraction issues."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class ExtractedDocument(BaseModel):
    filename: str
    file_type: str  # "pdf", "txt", or "pasted"
    text: str
    char_count: int
    word_count: int
    page_count: Optional[int] = None
    preview: str


def clean_text(raw_text: str) -> str:
    """Normalize whitespace and strip null bytes/surrogate characters."""
    if not raw_text:
        return ""
    # Remove null bytes and unprintable control characters (except newline, tab)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', raw_text)
    # Normalize unicode spaces
    text = text.replace('\xa0', ' ')
    # Normalize multiple blank lines to double newline
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def compute_stats(text: str) -> tuple[int, int]:
    """Return (char_count, word_count)."""
    char_count = len(text)
    word_count = len(text.split())
    return char_count, word_count


def extract_from_pdf_bytes(file_bytes: bytes, filename: str) -> ExtractedDocument:
    """Safely extract readable text from PDF bytes using PyMuPDF."""
    if not file_bytes or len(file_bytes) == 0:
        raise DocumentExtractionError("The uploaded PDF file is empty (0 bytes).")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise DocumentExtractionError(
            f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
        )

    try:
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        raise DocumentExtractionError(
            f"Unable to read PDF file. It may be corrupted or formatted improperly. Details: {str(e)}"
        )

    try:
        if doc.is_encrypted:
            raise DocumentExtractionError(
                "This PDF is password-protected or encrypted. Please remove password protection before uploading."
            )

        page_count = len(doc)
        if page_count == 0:
            raise DocumentExtractionError("The PDF contains no pages.")

        extracted_pages: list[str] = []
        total_image_count = 0

        for page_num in range(page_count):
            page = doc[page_num]
            page_text = page.get_text("text") or ""
            cleaned_page = clean_text(page_text)
            if cleaned_page:
                extracted_pages.append(cleaned_page)

            # Check if page has images to give better error diagnostics if text is missing
            try:
                images = page.get_images()
                total_image_count += len(images)
            except Exception:
                pass

        full_text = clean_text("\n\n".join(extracted_pages))

        # Check if usable text was found
        if not full_text or len(full_text) < 25:
            if total_image_count > 0:
                raise DocumentExtractionError(
                    "No readable text could be extracted from this PDF. "
                    "The document appears to consist of scanned pages or images without an embedded text layer. "
                    "Image-based scanned OCR is not supported in this version. "
                    "Please upload a digital PDF with selectable text, or paste your notes directly."
                )
            else:
                raise DocumentExtractionError(
                    "No readable text was found in this PDF document. "
                    "Please ensure the document contains extractable text."
                )

        if len(full_text) > MAX_TEXT_CHAR_LIMIT:
            # Inform user if text exceeds generous limit
            full_text = full_text[:MAX_TEXT_CHAR_LIMIT]

        char_count, word_count = compute_stats(full_text)
        preview = full_text[:300] + ("..." if len(full_text) > 300 else "")

        return ExtractedDocument(
            filename=filename,
            file_type="pdf",
            text=full_text,
            char_count=char_count,
            word_count=word_count,
            page_count=page_count,
            preview=preview
        )
    finally:
        try:
            doc.close()
        except Exception:
            pass


def extract_from_txt_bytes(file_bytes: bytes, filename: str) -> ExtractedDocument:
    """Safely decode plain text from bytes trying common encodings."""
    if not file_bytes or len(file_bytes) == 0:
        raise DocumentExtractionError("The uploaded text file is empty (0 bytes).")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise DocumentExtractionError(
            f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
        )

    # Attempt decodings safely
    decoded_text: Optional[str] = None
    for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
        try:
            decoded_text = file_bytes.decode(encoding)
            break
        except UnicodeDecodeError:
            continue

    if decoded_text is None:
        raise DocumentExtractionError("Failed to decode text file. Please ensure it is saved in UTF-8 encoding.")

    cleaned = clean_text(decoded_text)
    if not cleaned or len(cleaned) < 5:
        raise DocumentExtractionError("The text file is empty or contains only whitespace.")

    if len(cleaned) > MAX_TEXT_CHAR_LIMIT:
        cleaned = cleaned[:MAX_TEXT_CHAR_LIMIT]

    char_count, word_count = compute_stats(cleaned)
    preview = cleaned[:300] + ("..." if len(cleaned) > 300 else "")

    return ExtractedDocument(
        filename=filename,
        file_type="txt",
        text=cleaned,
        char_count=char_count,
        word_count=word_count,
        page_count=None,
        preview=preview
    )


def extract_from_pasted_text(raw_text: str, title: Optional[str] = None) -> ExtractedDocument:
    """Validate and package notes pasted by the user directly."""
    if not raw_text or not raw_text.strip():
        raise DocumentExtractionError("No notes were provided. Please type or paste your study material.")

    cleaned = clean_text(raw_text)
    if len(cleaned) < 10:
        raise DocumentExtractionError("Your notes are too short (minimum 10 characters required for analysis).")

    if len(cleaned) > MAX_TEXT_CHAR_LIMIT:
        cleaned = cleaned[:MAX_TEXT_CHAR_LIMIT]

    char_count, word_count = compute_stats(cleaned)
    display_title = (title.strip() if title and title.strip() else "Pasted Notes")
    if not display_title.endswith((".txt", ".notes")):
        display_title = f"{display_title}"

    preview = cleaned[:300] + ("..." if len(cleaned) > 300 else "")

    return ExtractedDocument(
        filename=display_title,
        file_type="pasted",
        text=cleaned,
        char_count=char_count,
        word_count=word_count,
        page_count=None,
        preview=preview
    )
