from pydantic import BaseModel, Field

from .models import User


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    name: str
    roleId: str
    roleLabel: str
    level: str
    agencyId: str
    agencyCode: str
    agencyName: str
    initials: str
    tone: str

    @classmethod
    def from_user(cls, user: User) -> "UserOut":
        return cls(
            id=user.id,
            username=user.username,
            email=user.email,
            name=user.name,
            roleId=user.role_id,
            roleLabel=user.role_label,
            level=user.level,
            agencyId=user.agency_id,
            agencyCode=user.agency_code,
            agencyName=user.agency_name,
            initials=user.initials,
            tone=user.tone
        )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class DemoAccount(BaseModel):
    username: str
    password: str
    name: str
    roleId: str
    roleLabel: str
    agencyCode: str
    agencyName: str


class MessageResponse(BaseModel):
    message: str
