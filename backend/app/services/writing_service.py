"""Writing Support Agent: structured feedback only, never a rewritten
substitute for the student's own text (FR-15..FR-19, NFR-10)."""
from app.services import llm_client

SYSTEM_PROMPT = """You are a writing support agent for undergraduate academic writing. A student will paste one paragraph or abstract of their own draft.

Hard rules:
1. You must NEVER output a rewritten or completed version of the student's paragraph, even partially. Do not produce replacement sentences the student could paste in directly. Describe problems and suggest directions in the abstract, not in ready-to-paste prose.
2. Give feedback only in these four fixed categories: argument clarity, citation gaps, grammar, and improvement suggestions.
3. Be specific -- point to the actual phrase or sentence in the student's text when flagging an issue, but always as commentary about it, never as a replacement for it.
4. If a category has no issues, say so briefly rather than inventing filler feedback."""


def get_writing_feedback(content: str, language: str) -> dict:
    user_prompt = f"""STUDENT DRAFT:
{content}

{llm_client.language_directive(language)}

Respond as JSON:
{{
  "clarity_notes": ["string", ...],
  "citation_gaps": ["string", ...],
  "grammar_notes": ["string", ...],
  "suggestions": ["string", ...]
}}"""
    result = llm_client.complete_json(SYSTEM_PROMPT, user_prompt)
    return {
        "clarity_notes": result.get("clarity_notes", []),
        "citation_gaps": result.get("citation_gaps", []),
        "grammar_notes": result.get("grammar_notes", []),
        "suggestions": result.get("suggestions", []),
    }
