# AI Academic Success Platform — Prototype

Full-stack implementation of the platform described in
[`PRD-AI-Academic-Success-Platform.md`](./PRD-AI-Academic-Success-Platform.md):
Research Discovery, Academic Integrity Advisor, Writing Support Agent, Source
Organiser, Bahasa Malaysia support, and a multi-tenant policy knowledge base.

## Architecture at a glance

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS, responsive web app.
- **Backend**: FastAPI (Python) — all AI orchestration (RAG, literature search, feedback generation) lives here.
- **Database**: SQLite by default (zero-install local dev/testing) or Postgres + `pgvector` via Docker for anything closer to production — same models, same code, switched purely by `DATABASE_URL`. See `app/db_types.py` / `app/models.py`.
- **Cache**: Redis, via Docker (falls back to an in-memory cache automatically if Redis isn't running).
- **LLM**: Local, via [Ollama](https://ollama.com) — powers all four AI features, no API key, no cost, no cloud account. (The PRD originally specified the Claude API; see below for why and how this is a one-file swap either direction.)
- **External literature APIs**: Semantic Scholar, DOAJ, OpenAlex (free, no signup required for prototype rate limits).

### Deviations from the PRD's cloud stack (and why)

The PRD's confirmed stack names Supabase (Auth/DB/Storage), the Claude API,
and Vercel/Railway hosting. This codebase implements the **same
architecture** but with self-hosted/free equivalents, so it runs completely
locally with **zero cloud accounts and zero API keys**:

| PRD calls for | This codebase uses | Why |
|---|---|---|
| Supabase Auth | Self-issued JWT auth (`python-jose` + `passlib`/bcrypt) in FastAPI | No Supabase project required to run the prototype |
| Supabase Postgres + pgvector | **SQLite by default**; Postgres via Docker optional (pgvector extension no longer required at all — see below) | Runs with zero installed services; Postgres remains a drop-in swap via `DATABASE_URL` for anything beyond local testing |
| Supabase Storage | Local disk under `backend/storage/` | Simplest option for a prototype; swap for S3/Supabase Storage later by changing `admin.py`'s file-write call |
| Embeddings (unspecified provider) | A dependency-free deterministic hashing embedder (`app/services/embeddings.py`) | Keeps the whole stack runnable with zero extra API keys/installs. **This is the one component you should not treat as production-quality** — see the note in that file for how to swap in Voyage AI or `sentence-transformers` before a real pilot. |
| pgvector SQL-side ANN search | Policy chunk embeddings are stored as plain JSON float arrays and matched via brute-force cosine similarity in Python (`rag_service.retrieve_top_chunks`) | Works identically on SQLite and Postgres with one code path; fine at prototype/pilot chunk volumes (hundreds–low thousands per tenant). Swap for a real pgvector column + SQL-side search if a tenant's policy corpus grows large enough for this to matter. |
| Claude API (Anthropic) | Local open-source model via Ollama (`app/services/llm_client.py`), default `llama3.1:8b` | Zero API key, zero per-request cost, works offline once the model is pulled -- important for a capstone/demo context. Tradeoffs: noticeably slower on CPU-only hardware, and lower-quality reasoning/JSON-reliability/Bahasa Malaysia fluency than Claude, especially on smaller models. Every caller only imports `complete_text`/`complete_json`/`language_directive` from this one module, so swapping back to Claude (or to Groq, Gemini, etc.) later means rewriting this one file, not the four feature services that use it. |

Multi-tenancy is implemented as specified: a shared database with a
`tenant_id` column on every tenant-owned table (see `app/models.py`).

## Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com/download) — required for the four AI features to actually generate output (everything else — auth, multi-tenancy, RAG retrieval, literature search, source resolution — runs and has been tested without it too). Free, no signup, no API key. **Verified working end-to-end** with `ollama pull llama3.2:3b` (~2GB, the current default) — see "Verified live with Ollama" below.
- Optional: Docker Desktop, only if you want to run against Postgres + Redis instead of the zero-install SQLite/in-memory-cache defaults

## Setup

### 0. Install Ollama and pull a model (one-time)

```bash
# Install from https://ollama.com/download (Windows/Mac/Linux), or on
# Windows with winget: winget install Ollama.Ollama
ollama pull llama3.2:3b
```

`ollama serve` usually starts automatically as a background service after
install; if `curl http://127.0.0.1:11434/api/tags` doesn't respond, run
`ollama serve` yourself. Any Ollama-supported chat model works — update
`OLLAMA_MODEL` in `backend/.env` to match whatever you pull. `llama3.2:3b`
(~2GB) is the default because it's fast enough on CPU-only hardware to
demo comfortably; a larger model (e.g. `qwen2.5:14b`) is slower but
noticeably better, particularly on Bahasa Malaysia fluency and reliable
structured JSON output — see the real quality tradeoffs observed below.

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Defaults already point at http://127.0.0.1:11434 / llama3.2:3b -- only
# edit .env if you pulled a different model or run Ollama elsewhere.
```

No database setup needed — `DATABASE_URL` defaults to a local SQLite file
(`aasp_dev.db`), created automatically on first run.

Seed realistic Malaysian-university dummy data: three tenants representative
of the PRD's target users, each with a policy admin, two students, and its
own tailored AI-use/academic integrity policy already chunked and indexed:

```bash
python -m app.seed
```

This creates:

| University | Type | Admin login | Student logins |
|---|---|---|---|
| UiTM Cawangan Sabah | Rural branch campus (BM default) | `admin@uitmsabah.demo.edu.my` | `nurul.aisyah@uitmsabah.demo.edu.my`, `azman.rahman@uitmsabah.demo.edu.my` |
| Universiti Malaysia Sabah (UMS) | East Malaysia public university (EN default) | `admin@ums.demo.edu.my` | `melissa.jaimin@ums.demo.edu.my`, `hafiz.osman@ums.demo.edu.my` |
| Open University Malaysia (OUM) | Distance-learning university (mixed) | `admin@oum.demo.edu.my` | `siti.zulaikha@oum.demo.edu.my`, `kumaran.veloo@oum.demo.edu.my` |

All accounts use the password `DemoPass123!`. A cross-tenant super-admin is
also created: `superadmin@aasp.demo` / `DemoPass123!`.

The three seeded policies are deliberately *different* institution-to-institution
(e.g. UiTM Sabah disallows AI-use disclosure as a workaround for substantive
content, UMS uses a disclosure-based model with a required AI Usage Statement,
OUM's policy is written explicitly for distance learners) — asking the same
question as a student from different universities should surface different,
correctly-cited answers, which is the whole point of the tenant-scoped
Policy Knowledge Base (PRD §7.2, §7.6).

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/api/health` — it should report `llm_available: true` once Ollama is running with the configured model pulled. If not, `llm_detail` says exactly which of the two is missing.

### Using Postgres instead of SQLite

Only needed if you want to test against the production-shaped data layer:

```bash
docker compose up -d   # Postgres (pgvector image, though pgvector itself is unused -- see table above) + Redis
```

Then set `DATABASE_URL=postgresql+psycopg://aasp:aasp@localhost:5432/aasp` in `backend/.env` before running `app.seed` / `uvicorn`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Visit `http://localhost:3000`. Log in with the seeded student account, or
register a new account against the seeded demo university.

## Walking through the PRD's success criterion

To verify the core success metric ("a B40 student can find 5 credible
sources, understand citation, and check AI-use permission in ≤ 20 minutes on
mobile"), log in as one of the seeded students above and:

1. **Research Discovery** — go to *Research Discovery*, enter a topic (e.g.
   "impact of social media on academic performance"). You'll get a themed
   summary with linked sources.
2. **Source Organiser** — copy 5 of the source titles/URLs from step 1 into
   *Source Organiser* to get formatted APA references, annotations, and
   credibility tiers.
3. **Academic Integrity Advisor** — ask "Can I use ChatGPT to help brainstorm
   my assignment?" as a UiTM Sabah student, then log in as a UMS or OUM
   student and ask the same question — the answers differ because each is
   grounded in that university's own uploaded policy and cites the specific
   section.
4. **Bahasa Malaysia** — toggle the language switch in the top nav (the UiTM
   Sabah and one OUM student account default to BM) and repeat any of the
   above; the UI, chatbot, and generated content switch to BM.
5. **Writing Support** (optional, not part of the timed flow) — paste a draft
   paragraph to see structured, non-generative feedback.

Steps 1, 3, and 5 require Ollama to be running with the model pulled —
without it they return a clean `503 Cannot reach Ollama...` rather than an
error page. Step 2 (source resolution, APA formatting, credibility tiering)
and the retrieval half of step 3 (finding the right policy excerpts) work
with Ollama stopped too, since they don't depend on the LLM.

### Verified live with Ollama (`llama3.2:3b`)

All four AI features were run end-to-end against the seeded Malaysian
university data above with a real local model generating real output (not
just read through) — `winget install Ollama.Ollama`, `ollama pull
llama3.2:3b`, then exercised through the actual HTTP API:

- **Academic Integrity Advisor**, UMS student, "Can I use ChatGPT to help
  brainstorm my assignment?" → correctly answered from UMS's own policy
  text, citing the right section, in ~10s.
- **Writing Support Agent** on a real weak paragraph → useful, specific
  feedback across all four categories (flagged an uncited claim, a vague
  phrase, a grammar issue, suggested a transition) in ~4s, and correctly
  never rewrote the paragraph itself.
- **Research Discovery**, "impact of social media on academic performance"
  → 14 real deduped sources from DOAJ/OpenAlex/Semantic Scholar, organized
  into themes/key findings/research gaps, in ~50s.
- **Source Organiser** annotation (the one LLM-dependent part of that
  feature) → a real 1-2 sentence summary generated for a resolved DOI, in
  ~3s.
- `/api/health` correctly flips to `llm_available: true` once Ollama has
  the model pulled, and every AI endpoint's response time is dominated by
  actual model inference, not overhead.

**Two real bugs this caught, both fixed:**
1. `research_service.py` told the model `research_gaps` should be a flat
   list of strings, but `llama3.2:3b` sometimes pattern-matched the
   adjacent `themes`/`key_findings` shape instead and returned
   `{"gap": "...", "source_indices": [...]}` objects, which broke Pydantic
   response validation with an unhandled `500`. Fixed with
   `_coerce_gap_to_string()`, which accepts either shape.
2. (Carried over from the earlier Claude-client testing, same fix applies
   to the Ollama client): the retry decorator was retrying a permanent "LLM
   unavailable" condition with backoff delays, and `tenacity`'s
   `RetryError` isn't an `HTTPException`, so FastAPI surfaced it as a raw
   `500` instead of a clean `503`. Fixed by excluding `HTTPException` from
   the retry policy.

**Real quality observations, not bugs — the documented Ollama tradeoff
actually showing up:**
- Asking the *same* brainstorming question in Bahasa Malaysia to a UiTM
  Sabah student returned the "I don't have enough information" fallback,
  even though retrieval correctly found the exact right policy section as
  its #1 match. The 3B model judged the excerpt "not answerable" — likely
  failing to reason through the BM nuance between "brainstorming" (allowed)
  and "menjana jawapan penuh untuk diserahkan" (generating a full
  submission, disallowed). A larger model would likely do better; this is
  the "weaker BM reasoning at small model sizes" tradeoff called out below,
  now observed rather than just anticipated.
- Research Discovery's themes were somewhat repetitive (two themes citing
  nearly the same six sources instead of genuinely distinct groupings) —
  useful and correctly source-grounded, but less sharply differentiated
  than a larger/frontier model would produce.

Two real bugs were caught and fixed by this testing (originally against the
Claude client, still applicable to the current Ollama client since both
share the same retry/error-handling structure): the retry decorator was
retrying (with backoff delays) even on a permanent "LLM unavailable"
condition, and `tenacity` wraps an exhausted retry in a `RetryError` that
isn't an `HTTPException` — so FastAPI surfaced it as an unhandled `500`
instead of the intended `503`. Fixed by excluding `HTTPException` from the
retry policy. Separately, resolving a `doi.org` URL in the Source Organiser
was doing a fuzzy full-text search on the URL string, which could return an
unrelated paper that happened to share a keyword; fixed by extracting the
DOI and resolving it directly against OpenAlex's per-work lookup instead
(`external_apis.resolve_doi`).

## Testing

```bash
cd backend
pytest
```

Runs against the default SQLite database — no external services required.

## Project layout

```
backend/
  app/
    main.py          FastAPI app + router wiring
    config.py         Environment-driven settings
    models.py         SQLAlchemy models (matches the PRD's ER diagram)
    schemas.py         Pydantic request/response models
    security.py        JWT + password hashing
    deps.py             Auth dependencies (current user, role guards)
    routers/            One router per feature area
    services/           Business logic: LLM client (Ollama), RAG, external APIs, etc.
    seed.py             Demo tenant/user/policy seeding script
frontend/
  src/app/              One route per feature (App Router)
  src/components/       NavBar, AuthProvider, LanguageToggle
  src/lib/               API client, i18n context
  messages/              en.json / ms.json translation dictionaries
```

## Known prototype limitations (see PRD §14 for the full list)

- Embeddings are a lightweight hashing scheme, not a real semantic model —
  Integrity Advisor retrieval quality will be noticeably better once swapped
  for a proper embedding model.
- No university SSO (email/password only).
- Google Scholar isn't directly integrated (no free official API) — Semantic
  Scholar, DOAJ, and OpenAlex stand in, per the PRD's documented assumption.
- No PWA/offline support yet (confirmed as out of scope for this stage).
- Source Organiser resolves a bare paper *title* (not a URL) via each
  provider's free-text search and takes the top hit — verified during
  testing that this can occasionally match an unrelated record sharing a
  keyword (e.g. a duplicate/mirror entry in OpenAlex). DOI URLs are resolved
  exactly via direct lookup and don't have this issue; titles are inherently
  fuzzier. Worth hardening (e.g. cross-checking against a second provider,
  or surfacing the match confidence to the student) before a real pilot.
- `passlib[bcrypt]==1.7.4` is incompatible with `bcrypt>=4.1` (a known
  upstream issue); `requirements.txt` pins `bcrypt==4.0.1` to avoid it.
- Local open-source models are meaningfully weaker than Claude at reliable
  structured JSON output and Bahasa Malaysia reasoning/fluency, especially
  at the small sizes (3B default) that run comfortably on CPU-only
  hardware. Confirmed live: `llama3.2:3b` occasionally deviates from the
  requested JSON shape (see the `research_gaps` coercion fix above) and
  under-answered a BM integrity question despite retrieval finding the
  correct policy excerpt. A larger model (`qwen2.5:14b` or similar) should
  do better on both fronts at the cost of speed.
- CPU-only inference is slow — a themed literature-review summary took
  ~50s with `llama3.2:3b` on the hardware this was tested on; a larger
  model or a busier multi-user deployment would take proportionally
  longer. A GPU narrows this considerably.
