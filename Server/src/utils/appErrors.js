class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errorCode = this.constructor.name; // ← Nombre de clase como código
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Recurso no encontrado') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

class ValidationError extends AppError {
    constructor(message = 'Datos inválidos') {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

class DatabaseError extends AppError {
    constructor(message = 'Error de base de datos') {
        super(message, 500);
        this.name = 'DatabaseError';
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'No autorizado') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

module.exports = {
    AppError,
    NotFoundError,
    ValidationError,
    DatabaseError,
    AuthenticationError
};