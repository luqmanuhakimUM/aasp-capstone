"""Cross-dialect column types so the same models run on Postgres (production)
and SQLite (zero-install local dev/testing) without code changes.
"""
import uuid

from sqlalchemy.types import CHAR, JSON, TypeDecorator


class GUID(TypeDecorator):
    """Stores a UUID as a 32-char hex string; returns a uuid.UUID on read."""

    impl = CHAR(32)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value.hex
        return uuid.UUID(str(value)).hex

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return uuid.UUID(value)


# Plain sqlalchemy.types.JSON already works transparently on both Postgres
# (native JSON) and SQLite (TEXT with JSON serialization) -- no dialect-specific
# JSONB needed for a prototype that never queries *inside* the JSON column.
JSONColumn = JSON
