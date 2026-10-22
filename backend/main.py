import os
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from config import GEMINI_MODEL, is_gemini_configured, MAX_FILE_SIZE_BYTES
from services.extractor import (
    extract_from_pdf_bytes,
    extract_from_txt_bytes,
    extract_from_pasted_text,
    DocumentExtractionError,
    ExtractedDocument
)
from services.ai_service import (
    generate_summary,
    generate_explanation,
    AIError,
    AIConfigurationError,
    AIResponse
)

app = FastAPI(
    title="MARGIN API",
    description="Backend API for MARGIN — Editorial AI Study Workspace (Powered by Google Gemini)",
    version="1.0.0"
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers
@app.exception_handler(DocumentExtractionError)
async def extraction_error_handler(request: Request, exc: DocumentExtractionError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "error_type": "extraction_error"}
    )


@app.exception_handler(AIConfigurationError)
async def ai_config_error_handler(request: Request, exc: AIConfigurationError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.message,
            "error_type": "configuration_missing",
            "instructions": "Add your GEMINI_API_KEY in backend/.env to enable AI generation."
        }
    )


@app.exception_handler(AIError)
async def ai_error_handler(request: Request, exc: AIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.message,
            "error_type": exc.error_code
        }
    )


# Request Models
class TextExtractRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw study notes text")
    title: Optional[str] = Field(default="Pasted Notes", description="Optional title for notes")


class AIRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Extracted document text to analyze")
    title: Optional[str] = Field(default=None, description="Document filename or title")


@app.get("/api/health")
async def health_check():
    """Health check endpoint providing status and Google Gemini AI readiness info."""
    return {
        "status": "healthy",
        "service": "MARGIN Study Workspace API",
        "gemini_configured": is_gemini_configured(),
        "gemini_model": GEMINI_MODEL,
        # Keep backward compatibility alias for frontend
        "ai_provider": "google-gemini",
        "openai_configured": is_gemini_configured(),
        "openai_model": GEMINI_MODEL,
        "max_file_size_mb": MAX_FILE_SIZE_BYTES // (1024 * 1024)
    }


@app.post("/api/extract", response_model=ExtractedDocument)
async def extract_file(file: UploadFile = File(...)):
    """Upload and extract text from PDF or TXT files."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file was provided in the upload request.")

    filename = file.filename
    lower_name = filename.lower()

    if not (lower_name.endswith(".pdf") or lower_name.endswith(".txt")):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{filename}'. Only .pdf and .txt documents are supported in this MVP."
        )

    # Read uploaded file content with size limit check
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the maximum size limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
        )

    if lower_name.endswith(".pdf"):
        return extract_from_pdf_bytes(content, filename)
    else:
        return extract_from_txt_bytes(content, filename)


@app.post("/api/extract-text", response_model=ExtractedDocument)
async def extract_text(payload: TextExtractRequest):
    """Validate and package directly pasted notes."""
    return extract_from_pasted_text(payload.text, payload.title)


@app.post("/api/summarize", response_model=AIResponse)
async def summarize_document(payload: AIRequest):
    """Generate structured study summary from provided text."""
    return generate_summary(text=payload.text, title=payload.title)


@app.post("/api/explain", response_model=AIResponse)
async def explain_document(payload: AIRequest):
    """Generate beginner-friendly plain-language explanation from provided text."""
    return generate_explanation(text=payload.text, title=payload.title)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
