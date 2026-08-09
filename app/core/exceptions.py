from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


def register_exception_handlers(app: FastAPI) -> None:
    """
    Register global exception handlers.
    """

    @app.exception_handler(ValueError)
    async def value_error_handler(
        request: Request,
        exc: ValueError,
    ) -> JSONResponse:

        return JSONResponse(
            status_code=400,
            content={
                "detail": str(exc),
            },
        )

    @app.exception_handler(FileNotFoundError)
    async def file_not_found_handler(
        request: Request,
        exc: FileNotFoundError,
    ) -> JSONResponse:

        return JSONResponse(
            status_code=404,
            content={
                "detail": str(exc),
            },
        )

    @app.exception_handler(RuntimeError)
    async def runtime_error_handler(
        request: Request,
        exc: RuntimeError,
    ) -> JSONResponse:

        return JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:

        return JSONResponse(
            status_code=500,
            content={
                "detail": "An unexpected error occurred.",
            },
        )