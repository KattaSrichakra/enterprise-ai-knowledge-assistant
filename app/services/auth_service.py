from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User


class AuthService:
    """
    Handles user registration and authentication operations.
    """

    @staticmethod
    def get_user_by_email(
        db: Session,
        email: str,
    ) -> User | None:
        """
        Retrieve a user by email address.
        """

        statement = select(User).where(
            User.email == email
        )

        return db.scalar(statement)

    @staticmethod
    def register_user(
        db: Session,
        email: str,
        password: str,
        full_name: str,
    ) -> User:
        """
        Create and persist a new user.

        Raises:
            ValueError:
                If a user with the email already exists.
        """

        normalized_email = email.strip().lower()

        existing_user = AuthService.get_user_by_email(
            db=db,
            email=normalized_email,
        )

        if existing_user is not None:
            raise ValueError(
                "A user with this email already exists."
            )

        user = User(
            email=normalized_email,
            password_hash=hash_password(password),
            full_name=full_name.strip(),
            is_active=True,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def authenticate_user(
        db: Session,
        email: str,
        password: str,
    ) -> User | None:
        """
        Authenticate a user using email and password.

        Returns:
            Authenticated User or None if authentication fails.
        """

        normalized_email = email.strip().lower()

        user = AuthService.get_user_by_email(
            db=db,
            email=normalized_email,
        )

        if user is None:
            return None

        if not user.is_active:
            return None

        if not verify_password(
            password,
            user.password_hash,
        ):
            return None

        return user