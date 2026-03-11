from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Response, Request, status

from app.config import settings
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    SignupRequest,
    UserResponse,
)
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

REFRESH_TOKEN_COOKIE = "refresh_token"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=settings.refresh_token_expire_days * 86400,
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE,
        path="/",
    )


async def _create_tokens_and_respond(
    user: User, response: Response
) -> AuthResponse:
    access_token = create_access_token(str(user.id), user.username)
    raw_refresh = create_refresh_token()

    await RefreshToken(
        user_id=str(user.id),
        token_hash=hash_refresh_token(raw_refresh),
        expires_at=datetime.utcnow()
        + timedelta(days=settings.refresh_token_expire_days),
    ).insert()

    _set_refresh_cookie(response, raw_refresh)

    return AuthResponse(
        access_token=access_token,
        user=UserResponse(
            id=str(user.id),
            username=user.username,
            onboarding_completed=user.onboarding_completed,
        ),
    )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, response: Response):
    existing = await User.find_one(User.username == body.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )

    user = User(
        username=body.username,
        password_hash=hash_password(body.password),
    )
    await user.insert()

    return await _create_tokens_and_respond(user, response)


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, response: Response):
    user = await User.find_one(User.username == body.username)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    return await _create_tokens_and_respond(user, response)


@router.post("/refresh", response_model=AuthResponse)
async def refresh(request: Request, response: Response):
    raw_token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token",
        )

    token_hash = hash_refresh_token(raw_token)
    stored = await RefreshToken.find_one(
        RefreshToken.token_hash == token_hash,
        RefreshToken.is_revoked == False,
    )

    if not stored or stored.expires_at < datetime.utcnow():
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Revoke old token (rotation)
    stored.is_revoked = True
    await stored.save()

    user = await User.get(stored.user_id)
    if not user:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return await _create_tokens_and_respond(user, response)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response):
    raw_token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if raw_token:
        token_hash = hash_refresh_token(raw_token)
        stored = await RefreshToken.find_one(RefreshToken.token_hash == token_hash)
        if stored:
            stored.is_revoked = True
            await stored.save()

    _clear_refresh_cookie(response)
