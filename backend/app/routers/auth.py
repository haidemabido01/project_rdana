from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import User
from ..schemas import DemoAccount, LoginRequest, MessageResponse, TokenResponse, UserOut
from ..security import (
    create_access_token,
    get_current_user,
    unauthorized,
    verify_password
)
from ..seed import DEMO_ACCOUNTS

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    username = payload.username.strip().lower()
    user = db.scalar(
        select(User).where(func.lower(User.username) == username)
    )

    if user is None or not verify_password(payload.password, user.password_hash):
        raise unauthorized("Invalid username or password")

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled"
        )

    user.last_login_at = datetime.now(timezone.utc)
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token, expires_in = create_access_token(user)
    return TokenResponse(
        access_token=access_token,
        expires_in=expires_in,
        user=UserOut.from_user(user)
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.from_user(current_user)


@router.post("/logout", response_model=MessageResponse)
def logout(current_user: User = Depends(get_current_user)) -> MessageResponse:
    return MessageResponse(message=f"Signed out {current_user.name}")


@router.get("/demo-accounts", response_model=list[DemoAccount])
def demo_accounts() -> list[DemoAccount]:
    if not settings.demo_mode:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    return [
        DemoAccount(
            username=account["username"],
            password=account["password"],
            name=account["name"],
            roleId=account["role_id"],
            roleLabel=account["role_label"],
            agencyCode=account["agency_code"],
            agencyName=account["agency_name"]
        )
        for account in DEMO_ACCOUNTS
    ]
