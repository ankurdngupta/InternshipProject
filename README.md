# MARGIN — Editorial AI Study Workspace

> **"Make sense of what you're studying."**
> A calm, intelligent, academic reading studio designed to help students comprehend and synthesize complex course materials without repetitive re-reading. Powered by **Google Gemini** via the official `google-genai` Python SDK.

---

## 1. Overview & Core Features (MVP)

MARGIN transforms dense study materials into structured academic summaries and beginner-friendly conceptual explanations.

### Feature A: Safe Document & Note Ingestion
- **PDF Upload (`.pdf`)**: Extracts readable text using **PyMuPDF** (`pymupdf`), validating page structure and text streams.
- **Plain Text Upload (`.txt`)**: Safely handles multi-encoding text decoding (`utf-8`, `utf-8-sig`, `latin-1`, `cp1252`).
- **Direct Note Composer**: Type or paste lecture slides, textbook excerpts, or rough notes with live word/character counters.
- **Scanned PDF Diagnostics**: Gracefully detects image-only or scanned PDFs without embedded text layers and presents a clear limitation message (OCR is not supported in this MVP).
- **Document Management**: Live metadata badges (filename, file format, page count, word count, character count) and expandable text preview. Users can replace or remove active documents with one click.
- **Validation**: Enforces strict size limits (15 MB), rejects empty/whitespace-only files, and handles corrupted files gracefully.

### Feature B: Dual-Mode AI Synthesis (Google Gemini)
- **"Generate Summary"**: Produces an authoritative academic study guide with:
  1. *Overview* (core thesis and orientation)
  2. *Key Concepts & Main Ideas* (structured bullet points)
  3. *Essential Terminology & Definitions* (bolded key terms with definitions)
  4. *Key Takeaways & Conclusion* (high-yield exam synthesis)
- **"Explain Simply"**: An intuitive translation of the same material for beginners:
  1. *The Big Picture* (plain English conceptual intuition)
  2. *Step-by-Step Breakdown* (demystifying each piece logically)
  3. *Intuitive Analogies* (concrete real-world mental models)
  4. *Plain-Language Jargon Buster* (technical terms translated to everyday words)
  5. *Key Rules to Remember* (preserves formulas and factual fidelity)
- **Official Google Gen AI SDK**: Uses the official `google-genai` Python SDK (`from google import genai`).
- **Free Tier Default**: Defaults to `gemini-2.5-flash` which is available on Google AI Studio's free tier.
- **Map-Reduce Long Document Handling**: Long materials exceeding 4,000 words are broken into overlapping chunks (~2,500 words each), processed across sections, and synthesized to prevent context truncation.
- **Editorial Reading Studio Design**: Art-directed around a warm paper background (`#FAF8F5`), deep ink typography (`#161513`), restrained rust accent (`#9E381C`), editorial serif headings (*Newsreader*), and spacious typography.

---

## 2. Project Structure

```
.
├── backend/
│   ├── config.py                 # Environment variables (GEMINI_API_KEY, GEMINI_MODEL)
│   ├── main.py                   # FastAPI application & REST endpoints
│   ├── requirements.txt          # Python dependencies (FastAPI, google-genai, PyMuPDF)
│   ├── .env.example              # Template for Gemini credentials
│   ├── services/
│   │   ├── extractor.py          # PyMuPDF extraction, encoding decoders, error handling
│   │   └── ai_service.py         # Google Gemini integration, chunking, prompts & error recovery
│   └── tests/
│       ├── test_backend.py       # 15 end-to-end extraction and API test cases
│       └── test_ai_unit.py       # Mocked Gemini AI prompt and response synthesis tests
├── frontend/
│   ├── index.html                # Editorial typography and fonts
│   ├── package.json              # React 18, Vite, Tailwind CSS, Lucide, ReactMarkdown
│   ├── tailwind.config.js        # Art-directed paper and ink color system
│   ├── vite.config.ts            # Dev server configuration and proxy
│   └── src/
│       ├── types.ts              # TypeScript interfaces
│       ├── api.ts                # Client API methods with structured error handling
│       ├── sampleData.ts         # 1-click test materials (Biology, CS, Economics)
│       ├── App.tsx               # Studio state and layout orchestrator
│       ├── main.tsx              # React entrypoint
│       └── components/
│           ├── Header.tsx            # MARGIN wordmark, Gemini status pill, and settings trigger
│           ├── WorkspaceHeading.tsx  # Welcoming studio header
│           ├── DocumentInput.tsx     # Drag-and-drop zone, note composer, 1-click sample presets
│           ├── DocumentCard.tsx      # Document metadata and expandable text preview
│           ├── ActionPanel.tsx       # Distinctive editorial buttons for Summary and Explanation
│           ├── EditorialReader.tsx   # Reading desk canvas with Markdown styling and copy action
│           ├── StatusBanner.tsx      # Actionable notification for API keys and scanned PDFs
│           └── ConfigModal.tsx       # Interactive Gemini API setup guide
├── .gitignore
├── .env.example
└── README.md
```

---

## 3. Quickstart & Installation

### Prerequisites
- Python 3.10+ (tested with Python 3.14)
- Node.js v18+ and npm

### 1. Configure Gemini Credentials
Create a `.env` file inside the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```ini
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

> **Free Tier Information**:
> Obtain a free API key at **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
> `gemini-2.5-flash` (and `gemini-1.5-flash`) have generous free-tier limits (15 requests/min, 1,500 requests/day).
> If no API key is provided, document extraction, text previews, and validation all work fully, and a clear setup guidance banner is displayed when requesting AI synthesis.

### 2. Backend Setup
From the project root:

```bash
# Navigate to backend and activate virtual environment
cd backend
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install dependencies (including google-genai)
pip install -r requirements.txt

# Run backend test suite
pytest tests -v

# Start FastAPI server on port 8000
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will be live at `http://127.0.0.1:8000`.
Interactive API documentation is at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
In a separate terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Build check
npm run build

# Start Vite dev server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 4. API Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health, Gemini configuration status, active model |
| `POST` | `/api/extract` | Multipart upload for `.pdf` and `.txt` files |
| `POST` | `/api/extract-text` | Ingests pasted notes with title and stats |
| `POST` | `/api/summarize` | Generates structured academic study summary using Gemini |
| `POST` | `/api/explain` | Generates plain-language, beginner explanation using Gemini |

---

## 5. Verification & Testing

- **Official `google-genai` SDK**: Integrated via `from google import genai` and `client.models.generate_content(...)`.
- **Backend Test Suite**: 17 tests passed (`pytest backend/tests -v`), verifying extraction, chunking, missing key handling, and mocked Gemini generations.
- **Security**: The API key is read solely by the backend from `GEMINI_API_KEY` (never exposed to frontend code or client network calls). Real `.env` files are excluded by `.gitignore`.
# Internship-Project
# Internship-Project
# Internship-Project
