from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    role_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    role_label: Mapped[str] = mapped_column(String(160), nullable=False)
    level: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    agency_id: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    agency_code: Mapped[str] = mapped_column(String(32), nullable=False)
    agency_name: Mapped[str] = mapped_column(String(160), nullable=False)
    initials: Mapped[str] = mapped_column(String(8), nullable=False)
    tone: Mapped[str] = mapped_column(String(20), nullable=False, default="slate")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
