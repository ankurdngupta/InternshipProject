from typing import Literal, Optional
from pydantic import BaseModel
from google import genai
from google.genai import types
from google.genai import errors

from config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    CHUNK_WORD_THRESHOLD,
    is_gemini_configured
)


class AIError(Exception):
    """Base exception for AI generation errors."""
    def __init__(self, message: str, status_code: int = 500, error_code: str = "ai_error"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code


class AIConfigurationError(AIError):
    def __init__(self, message: str = "GEMINI_API_KEY is not configured."):
        super().__init__(
            message=message,
            status_code=503,
            error_code="configuration_missing"
        )


class AIResponse(BaseModel):
    action: Literal["summary", "explanation"]
    title: str
    content: str
    model: str
    chunks_processed: int
    source_word_count: int


# System prompts designed specifically for the scholarly reading studio
SUMMARY_SYSTEM_PROMPT = """You are MARGIN, an expert academic tutor and editorial study assistant.
Your task is to analyze the user's provided study material and produce a clear, authoritative, and well-structured study summary.

GUIDELINES FOR SUMMARY:
1. Grounded Accuracy: Base your output STRICTLY on the provided source text. Do NOT invent facts, studies, or claims not present in the material.
2. Acknowledge Limits: If key definitions, proofs, or context are absent or incomplete in the text, explicitly acknowledge what is missing rather than speculating.
3. Clean Markdown Structure: Use the following clear sections:
   - ## Overview
     A concise 2-3 sentence orientation capturing the primary thesis or subject matter.
   - ## Key Concepts & Main Ideas
     A structured, bulleted breakdown of the core themes, methodologies, or arguments. Group closely related points logically.
   - ## Essential Terminology & Definitions
     Bold the term followed by an accurate, clear explanation from the text. If no specific jargon is introduced, mention the key concepts and their operational meanings.
   - ## Key Takeaways & Conclusion
     A focused 2-3 point synthesis of what the student must remember for exams or practical understanding.
4. Tone & Style: Academic, crisp, informative, and free of conversational fluff. Do not use generic filler like "Sure, here is your summary:". Begin directly with the Markdown headings.
"""

EXPLANATION_SYSTEM_PROMPT = """You are MARGIN, an intuitive master educator who explains complex academic subjects in plain, beginner-friendly English without losing technical fidelity.
Your task is to transform the provided study material into an easy-to-understand explanation that demystifies hard concepts.

GUIDELINES FOR SIMPLE EXPLANATION:
1. Beginner-Friendly & Clear: Explain the material so that a curious newcomer can grasp the logic immediately. Avoid dense academic phrasing.
2. Step-by-Step Logic: Break multi-layered ideas or workflows into intuitive, numbered or sequential steps.
3. Concrete Analogies: Use natural real-world analogies, mental models, or simple relatable examples to anchor abstract theories.
4. Jargon Buster: Whenever a technical term is introduced, immediately explain what it means in simple everyday words.
5. Preserve Factual Integrity: Maintain accurate formulas, core principles, names, and key rules from the source. Do not simplify to the point of factual inaccuracy.
6. Honest Bounds: Only explain what is actually contained in the text. If the text cuts off or omits prerequisites, briefly note that.
7. Tone & Style: Warm, patient, lucid, and direct. Do not say "Welcome to this explanation" or "Hope this helps!". Start directly with clear Markdown headings:
   - ## The Big Picture
   - ## Step-by-Step Breakdown
   - ## Intuitive Analogy
   - ## Plain-Language Jargon Buster
   - ## Key Rules to Remember
"""

CHUNK_SUMMARY_PROMPT = """Analyze the following segment from a study document.
Extract all key facts, principles, technical definitions, and arguments accurately.
Preserve exact terminology, numbers, formulas, and structural relationships.
Output clean bullet points with no pleasantries.
"""


def chunk_text(text: str, chunk_size_words: int = 2500, overlap_words: int = 150) -> list[str]:
    """Split long text into coherent overlapping chunks respecting paragraphs."""
    paragraphs = text.split("\n\n")
    chunks: list[str] = []
    current_chunk_words: list[str] = []
    current_word_count = 0

    for paragraph in paragraphs:
        p_words = paragraph.split()
        if not p_words:
            continue

        if current_word_count + len(p_words) > chunk_size_words and current_chunk_words:
            chunk_str = " ".join(current_chunk_words)
            chunks.append(chunk_str)

            # Keep overlap from the end of current chunk
            overlap = current_chunk_words[-overlap_words:] if len(current_chunk_words) > overlap_words else []
            current_chunk_words = list(overlap) + p_words
            current_word_count = len(current_chunk_words)
        else:
            current_chunk_words.extend(p_words)
            current_word_count += len(p_words)

    if current_chunk_words:
        chunks.append(" ".join(current_chunk_words))

    return chunks if chunks else [text]


def get_gemini_client() -> genai.Client:
    """Return an instantiated Google Gen AI client or raise an explanatory configuration error."""
    if not is_gemini_configured():
        raise AIConfigurationError(
            "Google Gemini API key is missing or not configured. "
            "Please set GEMINI_API_KEY in your backend/.env file to enable AI generation."
        )
    return genai.Client(api_key=GEMINI_API_KEY)


def call_gemini_completion(
    client: genai.Client,
    system_prompt: str,
    user_prompt: str,
    model: str = GEMINI_MODEL,
    temperature: float = 0.3
) -> str:
    """Execute a Google Gemini model generation call with unified error handling."""
    try:
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
        )
        response = client.models.generate_content(
            model=model,
            contents=user_prompt,
            config=config,
        )
        content = response.text or ""
        if not content.strip():
            raise AIError("The Gemini model returned an empty response. Please retry.", status_code=502)
        return content.strip()
    except errors.ClientError as e:
        err_msg = str(e)
        if "API_KEY_INVALID" in err_msg or ("INVALID_ARGUMENT" in err_msg and "key" in err_msg.lower()):
            raise AIError(
                f"Google Gemini authentication failed: {err_msg}. Please check that your GEMINI_API_KEY in backend/.env is valid.",
                status_code=401,
                error_code="auth_failed"
            )
        elif "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg or "quota" in err_msg.lower():
            raise AIError(
                f"Gemini API rate limit or quota exceeded: {err_msg}. Please wait a moment or check your Google AI Studio quotas.",
                status_code=429,
                error_code="rate_limit"
            )
        elif "NOT_FOUND" in err_msg or "404" in err_msg:
            raise AIError(
                f"The requested Gemini model '{model}' was not found or is unavailable: {err_msg}. "
                "Try setting GEMINI_MODEL=gemini-2.5-flash or GEMINI_MODEL=gemini-1.5-flash in backend/.env.",
                status_code=404,
                error_code="model_not_found"
            )
        else:
            raise AIError(
                f"Gemini API client error ({getattr(e, 'code', 'unknown')}): {err_msg}",
                status_code=400,
                error_code="client_error"
            )
    except errors.ServerError as e:
        raise AIError(
            f"Google Gemini service error: {str(e)}. Google AI servers may be experiencing temporary delays.",
            status_code=503,
            error_code="server_error"
        )
    except errors.APIError as e:
        raise AIError(
            f"Google Gemini API error: {str(e)}",
            status_code=502,
            error_code="provider_error"
        )
    except AIError:
        raise
    except Exception as e:
        raise AIError(f"Unexpected error during Gemini AI generation: {str(e)}", status_code=500)


def generate_summary(text: str, title: Optional[str] = None) -> AIResponse:
    """Generate a structured, academic study summary from source text using Google Gemini."""
    if not text or not text.strip():
        raise AIError("No source text provided for summarization.", status_code=400)

    client = get_gemini_client()
    words = text.split()
    source_word_count = len(words)
    doc_title = title.strip() if title and title.strip() else "Study Document"

    # For long documents, perform map-reduce chunking
    if source_word_count > CHUNK_WORD_THRESHOLD:
        chunks = chunk_text(text, chunk_size_words=2500, overlap_words=150)
        chunk_summaries: list[str] = []

        for idx, chunk in enumerate(chunks, 1):
            chunk_prompt = f"DOCUMENT: {doc_title} (Section {idx} of {len(chunks)})\n\n{chunk}"
            intermediate = call_gemini_completion(
                client=client,
                system_prompt=CHUNK_SUMMARY_PROMPT,
                user_prompt=chunk_prompt,
                model=GEMINI_MODEL,
                temperature=0.2
            )
            chunk_summaries.append(f"### Section {idx} Key Points:\n{intermediate}")

        combined_notes = "\n\n".join(chunk_summaries)
        synthesis_prompt = (
            f"DOCUMENT TITLE: {doc_title}\n\n"
            f"Below are compiled analytical notes across all {len(chunks)} sections of this long document. "
            f"Synthesize them into a single, cohesive, high-quality study summary following your structured format:\n\n"
            f"{combined_notes}"
        )

        final_content = call_gemini_completion(
            client=client,
            system_prompt=SUMMARY_SYSTEM_PROMPT,
            user_prompt=synthesis_prompt,
            model=GEMINI_MODEL,
            temperature=0.3
        )

        return AIResponse(
            action="summary",
            title=f"Summary of {doc_title}",
            content=final_content,
            model=GEMINI_MODEL,
            chunks_processed=len(chunks),
            source_word_count=source_word_count
        )

    # Standard single-pass
    user_prompt = f"DOCUMENT TITLE: {doc_title}\n\nDOCUMENT TEXT:\n{text}"
    final_content = call_gemini_completion(
        client=client,
        system_prompt=SUMMARY_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        model=GEMINI_MODEL,
        temperature=0.3
    )

    return AIResponse(
        action="summary",
        title=f"Summary of {doc_title}",
        content=final_content,
        model=GEMINI_MODEL,
        chunks_processed=1,
        source_word_count=source_word_count
    )


def generate_explanation(text: str, title: Optional[str] = None) -> AIResponse:
    """Generate a beginner-friendly, plain-English explanation using Google Gemini."""
    if not text or not text.strip():
        raise AIError("No source text provided for explanation.", status_code=400)

    client = get_gemini_client()
    words = text.split()
    source_word_count = len(words)
    doc_title = title.strip() if title and title.strip() else "Study Document"

    if source_word_count > CHUNK_WORD_THRESHOLD:
        chunks = chunk_text(text, chunk_size_words=2500, overlap_words=150)
        chunk_summaries: list[str] = []

        for idx, chunk in enumerate(chunks, 1):
            chunk_prompt = f"DOCUMENT: {doc_title} (Section {idx} of {len(chunks)})\n\n{chunk}"
            intermediate = call_gemini_completion(
                client=client,
                system_prompt=CHUNK_SUMMARY_PROMPT,
                user_prompt=chunk_prompt,
                model=GEMINI_MODEL,
                temperature=0.2
            )
            chunk_summaries.append(f"### Section {idx} Source Points:\n{intermediate}")

        combined_notes = "\n\n".join(chunk_summaries)
        synthesis_prompt = (
            f"DOCUMENT TITLE: {doc_title}\n\n"
            f"Below are key concepts extracted from across all {len(chunks)} sections of this long document. "
            f"Transform all of these concepts into a clear, unified, beginner-friendly explanation following your structure:\n\n"
            f"{combined_notes}"
        )

        final_content = call_gemini_completion(
            client=client,
            system_prompt=EXPLANATION_SYSTEM_PROMPT,
            user_prompt=synthesis_prompt,
            model=GEMINI_MODEL,
            temperature=0.4
        )

        return AIResponse(
            action="explanation",
            title=f"Simple Explanation of {doc_title}",
            content=final_content,
            model=GEMINI_MODEL,
            chunks_processed=len(chunks),
            source_word_count=source_word_count
        )

    # Standard single pass
    user_prompt = f"DOCUMENT TITLE: {doc_title}\n\nSOURCE MATERIAL:\n{text}"
    final_content = call_gemini_completion(
        client=client,
        system_prompt=EXPLANATION_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        model=GEMINI_MODEL,
        temperature=0.4
    )

    return AIResponse(
        action="explanation",
        title=f"Simple Explanation of {doc_title}",
        content=final_content,
        model=GEMINI_MODEL,
        chunks_processed=1,
        source_word_count=source_word_count
    )
