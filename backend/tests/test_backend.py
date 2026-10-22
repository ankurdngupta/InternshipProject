import pytest
from fastapi.testclient import TestClient
import pymupdf
import io
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from services.extractor import (
    extract_from_pdf_bytes,
    extract_from_txt_bytes,
    extract_from_pasted_text,
    DocumentExtractionError,
    clean_text
)
from services.ai_service import chunk_text

client = TestClient(app)


def create_test_pdf(text: str) -> bytes:
    """Helper to generate a real in-memory PDF using PyMuPDF."""
    doc = pymupdf.open()
    page = doc.new_page()
    rect = pymupdf.Rect(50, 50, 550, 750)
    page.insert_textbox(rect, text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def create_image_only_pdf() -> bytes:
    """Helper to generate an empty/scanned-like PDF with no text layer."""
    doc = pymupdf.open()
    page = doc.new_page()
    # Draw a rectangle mimicking an image scan without any text
    page.draw_rect(pymupdf.Rect(50, 50, 400, 600), color=(0.8, 0.8, 0.8), fill=(0.9, 0.9, 0.9))
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "openai_configured" in data


def test_clean_text():
    dirty = "Hello\x00\x07 World\n\n\n\n\nNew Paragraph\xa0here."
    cleaned = clean_text(dirty)
    assert "\x00" not in cleaned
    assert "\x07" not in cleaned
    assert "\xa0" not in cleaned
    assert "Hello World" in cleaned
    assert "New Paragraph here." in cleaned


def test_extract_valid_pdf():
    sample_text = (
        "Cellular respiration is a series of chemical reactions that break down glucose "
        "to produce ATP, which can be used as energy to power many reactions throughout the body. "
        "There are three main steps of cellular respiration: glycolysis, the citric acid cycle, "
        "and oxidative phosphorylation."
    )
    pdf_bytes = create_test_pdf(sample_text)
    result = extract_from_pdf_bytes(pdf_bytes, "biology_notes.pdf")

    assert result.filename == "biology_notes.pdf"
    assert result.file_type == "pdf"
    assert "Cellular respiration" in result.text
    assert result.word_count > 20
    assert result.page_count == 1
    assert len(result.preview) > 0


def test_extract_empty_pdf():
    with pytest.raises(DocumentExtractionError) as exc_info:
        extract_from_pdf_bytes(b"", "empty.pdf")
    assert "empty" in str(exc_info.value).lower()


def test_extract_corrupted_pdf():
    with pytest.raises(DocumentExtractionError) as exc_info:
        extract_from_pdf_bytes(b"This is not a real PDF at all %PDF-fake-corrupted", "corrupted.pdf")
    assert "corrupted" in str(exc_info.value).lower() or "unable" in str(exc_info.value).lower()


def test_extract_scanned_image_pdf():
    pdf_bytes = create_image_only_pdf()
    with pytest.raises(DocumentExtractionError) as exc_info:
        extract_from_pdf_bytes(pdf_bytes, "scanned_doc.pdf")
    err_msg = str(exc_info.value).lower()
    assert "no readable text" in err_msg or "ocr" in err_msg


def test_extract_valid_txt():
    sample_text = (
        "Operating Systems: Virtual memory provides an idealized abstraction of the storage "
        "resources that are actually available on a given machine which creates the illusion to users "
        "of a very large memory space."
    )
    txt_bytes = sample_text.encode("utf-8")
    result = extract_from_txt_bytes(txt_bytes, "os_notes.txt")

    assert result.filename == "os_notes.txt"
    assert result.file_type == "txt"
    assert "Virtual memory" in result.text
    assert result.word_count > 15


def test_extract_empty_txt():
    with pytest.raises(DocumentExtractionError) as exc_info:
        extract_from_txt_bytes(b"   \n\t  ", "empty.txt")
    assert "empty" in str(exc_info.value).lower()


def test_extract_pasted_text():
    sample_notes = (
        "Quantum superposition states that any two (or more) quantum states can be added together "
        "and the result will be another valid quantum state."
    )
    result = extract_from_pasted_text(sample_notes, "Physics Lecture 1")
    assert result.filename == "Physics Lecture 1"
    assert result.file_type == "pasted"
    assert result.word_count > 10


def test_extract_pasted_text_too_short():
    with pytest.raises(DocumentExtractionError) as exc_info:
        extract_from_pasted_text("Too short", "Notes")
    assert "too short" in str(exc_info.value).lower()


def test_api_extract_endpoint_pdf():
    sample_text = (
        "Microeconomics study guide: Supply and demand is an economic model of price determination "
        "in a competitive market. It concludes that in a competitive market, the unit price for a "
        "particular good will vary until it settles at a point where the quantity demanded equals "
        "the quantity supplied."
    )
    pdf_bytes = create_test_pdf(sample_text)

    response = client.post(
        "/api/extract",
        files={"file": ("econ.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "econ.pdf"
    assert data["file_type"] == "pdf"
    assert "Supply and demand" in data["text"]


def test_api_extract_endpoint_unsupported_format():
    response = client.post(
        "/api/extract",
        files={"file": ("test.docx", io.BytesIO(b"fake docx content"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_api_extract_text_endpoint():
    response = client.post(
        "/api/extract-text",
        json={"text": "Photosynthesis converts light energy into chemical energy stored in glucose.", "title": "Bio Chapter 3"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "Bio Chapter 3"
    assert "Photosynthesis" in data["text"]


def test_chunking_logic():
    # Create long text of ~6000 words
    paragraph = "This is a detailed academic paragraph analyzing machine learning algorithms. " * 30
    long_text = "\n\n".join([paragraph] * 15)
    chunks = chunk_text(long_text, chunk_size_words=1000, overlap_words=50)
    assert len(chunks) > 1
    # Verify non-empty
    for chunk in chunks:
        assert len(chunk.split()) > 0


def test_ai_without_key_returns_clear_configuration_error():
    # If no key is set, the API must return a clear 503 configuration error
    response = client.post(
        "/api/summarize",
        json={"text": "Short excerpt for testing without key configuration.", "title": "Test Doc"}
    )
    # Status should be 503 (Configuration missing) if key is empty
    if response.status_code == 503:
        assert "GEMINI_API_KEY" in response.json()["detail"] or "Gemini" in response.json()["detail"]
        assert "configuration_missing" in response.json()["error_type"]
