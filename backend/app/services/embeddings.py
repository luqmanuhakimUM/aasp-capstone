"""Text embedding for policy-document RAG retrieval.

Prototype default: a deterministic hashing-based bag-of-words embedder with
zero external dependencies and zero cost, so the codebase runs end-to-end
without any signup beyond an Anthropic API key. Semantic quality is lower
than a real embedding model.

Before a real pilot, swap this for a proper embedding model (e.g. Voyage AI's
`voyage-3` -- Anthropic's recommended embedding partner -- or a local
`sentence-transformers` model). Both would slot in behind the same
`embed_text` function signature used throughout `rag_service.py`.
"""
import hashlib
import math
import re

from app.models import EMBEDDING_DIM

_TOKEN_RE = re.compile(r"[a-zA-ZÀ-ɏ]+")


def _tokenize(text: str) -> list[str]:
    return [t.lower() for t in _TOKEN_RE.findall(text) if len(t) > 1]


def embed_text(text: str) -> list[float]:
    """Deterministic hashing-trick embedding, L2-normalized to EMBEDDING_DIM floats."""
    vector = [0.0] * EMBEDDING_DIM
    tokens = _tokenize(text)
    if not tokens:
        return vector

    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:4], "big") % EMBEDDING_DIM
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vector[index] += sign

    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [v / norm for v in vector]
    return vector


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
