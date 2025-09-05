const { error } = require('winston');

class AppError extends Error {
    constructor(message, statusCode, details=null) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errorCode = this.constructor.name; 
        this.details = details;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON(){
        return{
            success:false,
            error: this.message,
            code: this.errorCode,
            status: this.statusCode,
            timestamp: this.timestamp,
            ...(this.details && {details:this.details})
        };
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Recurso no encontrado', details=null) {
        super(message, 404, details);
        this.name = 'NotFoundError';
    }
}

class ValidationError extends AppError {
    constructor(message = 'Datos inválidos', details=null) {
        super(message, 400, details);
        this.name = 'ValidationError';
    }
}

class DatabaseError extends AppError {
    constructor(message = 'Error de base de datos', details=null) {
        super(message, 500, details);
        this.name = 'DatabaseError';
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'No autorizado', details=null) {
        super(message, 401, details);
        this.name = 'AuthenticationError';
    }
}

class ConflictError extends AppError {
    constructor(message = 'Conflicto con el recurso', details = null) {
        super(message, 409, details);
        this.name = 'ConflictError';
    }
}


module.exports = {
    AppError,
    NotFoundError,
    ValidationError,
    DatabaseError,
    AuthenticationError,
    ConflictError
};