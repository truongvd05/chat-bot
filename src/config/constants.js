export const ERROR_MESSAGE = {
    UNAUTHORIZED: "Unauthorized",
    NOT_FOUND: "not found",
    INVALID_JSON: "Invalid JSON format",
    DATABASE_ERROR: "database operation failed",
    DUPLICATE_EMAIL: "Email already exists",
    VALIDATE: "Validation error",
};

export const HTTP_STATUS = {
    ok: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    GONE: 410,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
};

export const QUEUE_STATUS = {
    PENDING: "pending",
    INPROGRESS: "inprogress",
    COMPLETED: "completed",
    FAILED: "failed",
};

export const PRISMA_CODE = {
    DUPLICATE: "P2002",
    NOT_FOUND: "P2025",
    FOREIGN_KEY: "P2003",
    VALUE_TOO_LONG: "P2000",
    NULL_CONSTRAINT: "P2011",
    INVALID_INPUT: "P2006",
};
