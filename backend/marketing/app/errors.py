"""Errors the API is willing to describe to the caller, and the one response envelope.

Anything raised that is *not* an AppError is treated as a bug and reported as a generic
500, so internal failures (a malformed query, a None dereference) never leak their message
to a client in production.
"""

from typing import Any

from fastapi.responses import JSONResponse, Response


class AppError(Exception):
    def __init__(self, message: str, status: int = 500, code: str = "INTERNAL_ERROR", details: Any = None) -> None:
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code
        self.details = details

    @classmethod
    def bad_request(cls, message: str, details: Any = None) -> "AppError":
        return cls(message, 400, "BAD_REQUEST", details)

    @classmethod
    def unauthorized(cls, message: str = "Authentication required") -> "AppError":
        return cls(message, 401, "UNAUTHORIZED")

    @classmethod
    def not_found(cls, resource: str) -> "AppError":
        return cls(resource + " not found", 404, "NOT_FOUND")

    @classmethod
    def conflict(cls, message: str) -> "AppError":
        return cls(message, 409, "CONFLICT")

    @classmethod
    def validation(cls, details: Any) -> "AppError":
        return cls("The request did not pass validation", 422, "VALIDATION_FAILED", details)


def ok(data: Any, message: str = "OK") -> JSONResponse:
    return JSONResponse({"success": True, "message": message, "data": data}, status_code=200)


def created(data: Any, message: str = "Created") -> JSONResponse:
    return JSONResponse({"success": True, "message": message, "data": data}, status_code=201)


def no_content() -> Response:
    return Response(status_code=204)


def error_body(err: AppError) -> dict[str, Any]:
    body: dict[str, Any] = {"success": False, "message": err.message, "errorCode": err.code}
    if err.details is not None:
        body["details"] = err.details
    return body
