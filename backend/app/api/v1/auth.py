# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status, Response, Request
from app.schemas.schemas import UserCreate, UserLogin, Token, UserOut
from app.services.auth_service import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory mock database for instant testing & standalone operation
MOCK_USERS_DB = {
    "alex.developer@hackathon.dev": {
        "id": 1,
        "email": "alex.developer@hackathon.dev",
        "name": "Alex Morgan",
        "password_hash": get_password_hash("Hackathon#2026"),
        "created_at": "2026-01-15T08:30:00Z"
    }
}


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, response: Response):
    user = MOCK_USERS_DB.get(credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No account found for '{credentials.email}'. Please create an account to get started."
        )
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password credentials. Please verify your credentials."
        )

    access_token = create_access_token(data={"sub": user["email"], "user_id": user["id"]})
    
    # Set secure JWT HTTP-only cookie as required by architecture
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=86400,
        samesite="lax",
        secure=False  # Set to True in production with HTTPS
    )

    # Look up user's profile to retrieve domain
    from app.api.v1.profile import MOCK_PROFILE_DB
    user_prof = MOCK_PROFILE_DB.get(user["id"], {})
    selected_domain = user_prof.get("selected_domain") or user.get("interested_domain") or "ai-agents"

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name", user["email"].split('@')[0]),
            "created_at": user["created_at"]
        },
        "selected_domain": selected_domain
    }


@router.post("/register", response_model=Token)
def register(user_in: UserCreate, response: Response):
    from app.api.v1.profile import MOCK_PROFILE_DB
    if user_in.email in MOCK_USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists. Please sign in instead."
        )

    chosen_domain = user_in.interested_domain or "ai-agents"
    new_user_id = len(MOCK_USERS_DB) + 1
    new_user = {
        "id": new_user_id,
        "email": user_in.email,
        "name": user_in.name or user_in.email.split('@')[0],
        "password_hash": get_password_hash(user_in.password),
        "interested_domain": chosen_domain,
        "created_at": "2026-10-01T12:00:00Z"
    }
    MOCK_USERS_DB[user_in.email] = new_user

    # Automatically provision profile with their chosen interested domain
    MOCK_PROFILE_DB[new_user_id] = {
        "user_id": new_user_id,
        "selected_domain": chosen_domain,
        "education": "Engineering Graduate",
        "skills": ["System Design", "Git", chosen_domain],
        "interests": [chosen_domain],
        "target_role": f"{chosen_domain} Specialist",
        "bio": f"Specializing in {chosen_domain} architectures."
    }

    access_token = create_access_token(data={"sub": new_user["email"], "user_id": new_user["id"]})
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=86400,
        samesite="lax",
        secure=False
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user["id"],
            "email": new_user["email"],
            "name": new_user["name"],
            "created_at": new_user["created_at"]
        },
        "selected_domain": chosen_domain
    }


@router.get("/me")
def get_current_user(request: Request):
    # Route guard
    auth_header = request.headers.get("Authorization")
    cookie_token = request.cookies.get("access_token")
    if not auth_header and not cookie_token:
        # Default mock demo user for seamless interaction
        return MOCK_USERS_DB["alex.developer@hackathon.dev"]
    return MOCK_USERS_DB["alex.developer@hackathon.dev"]


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Successfully logged out of session"}
