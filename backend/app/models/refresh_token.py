from datetime import datetime

from beanie import Document, Indexed
from pydantic import Field


class RefreshToken(Document):
    user_id: Indexed(str)  # type: ignore[valid-type]
    token_hash: Indexed(str)  # type: ignore[valid-type]
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_revoked: bool = False

    class Settings:
        name = "refresh_tokens"
