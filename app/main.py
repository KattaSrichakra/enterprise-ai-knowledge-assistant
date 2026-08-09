from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Enterprise AI Knowledge Assistant "
        "powered by Retrieval-Augmented Generation (RAG)."
    ),
)

register_exception_handlers(app)

app.include_router(api_router)