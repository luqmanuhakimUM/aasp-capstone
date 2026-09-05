"""Extracts text from uploaded policy documents (FR-29) and splits it into
retrieval-sized chunks for embedding (FR-30)."""
import io

from docx import Document as DocxDocument
from pypdf import PdfReader

CHUNK_SIZE_CHARS = 1200
CHUNK_OVERLAP_CHARS = 150


def extract_pages(file_bytes: bytes, filename: str) -> list[tuple[int, str]]:
    """Returns a list of (page_number, text) tuples, 1-indexed pages."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(file_bytes))
        return [(i + 1, page.extract_text() or "") for i, page in enumerate(reader.pages)]
    if lower.endswith(".docx"):
        doc = DocxDocument(io.BytesIO(file_bytes))
        full_text = "\n".join(p.text for p in doc.paragraphs)
        return [(1, full_text)]
    # Plain text fallback
    return [(1, file_bytes.decode("utf-8", errors="ignore"))]


def chunk_pages(pages: list[tuple[int, str]]) -> list[tuple[int, str]]:
    """Returns a list of (page_number, chunk_text) with overlapping windows."""
    chunks: list[tuple[int, str]] = []
    for page_number, text in pages:
        text = text.strip()
        if not text:
            continue
        start = 0
        while start < len(text):
            end = start + CHUNK_SIZE_CHARS
            chunk = text[start:end].strip()
            if chunk:
                chunks.append((page_number, chunk))
            start = end - CHUNK_OVERLAP_CHARS
            if start <= 0:
                break
    return chunks
