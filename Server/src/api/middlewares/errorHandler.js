const {
    NotFoundError,
    ValidationError,
    DatabaseError,
    AuthenticationError,
    AppError,
    ForbiddenError,
    RateLimitError,
    ServiceUnavailableError,
    ConflictError
} = require('../../infrastructure/utils/errors/appErrors');

const isProduction = process.env.NODE_ENV === 'production';

const errorHandler = (error, req, res, next) => {
    console.error('=== ERROR HANDLER LOG ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Path:', req.path);
    console.error('Method:', req.method);
    console.error('IP:', req.ip);
    console.error('User Agent:', req.get('User-Agent'));
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code || error.errorCode || 'N/A');
    console.error('Status Code:', error.statusCode || 'N/A');
    
    if (!isProduction) {
        console.error('Stack:', error.stack);
    }
    console.error('=================');

    let appError;
    let retryAfter = null;

    
    if (error instanceof AppError) {
        appError = error;
        if (error instanceof RateLimitError) {
            retryAfter = '60';
        }
    } else {
        // Mapped no AppError instance 
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            appError = new ConflictError(
                'Recurso duplicado',
                isProduction ? null : { 
                    originalError: error.message,
                    mysqlCode: error.code,
                    mysqlErrno: error.errno
                }
            );
        } 
        else if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
            appError = new ValidationError(
                'Referencia inválida - el recurso relacionado no existe',
                isProduction ? null : { 
                    originalError: error.message,
                    mysqlCode: error.code 
                }
            );
        }
        else if (error.code === 'ER_DATA_TOO_LONG' || error.errno === 1406) {
            appError = new ValidationError(
                'Datos demasiado largos para la columna',
                isProduction ? null : { 
                    originalError: error.message,
                    mysqlCode: error.code 
                }
            );
        }
        else if (error.code === 'ER_BAD_NULL_ERROR' || error.errno === 1048) {
            appError = new ValidationError(
                'Campo requerido no puede ser nulo',
                isProduction ? null : { 
                    originalError: error.message,
                    mysqlCode: error.code 
                }
            );
        }
        else if (error.name === 'ValidationError' || error.name === 'ValidatorError') {
            appError = new ValidationError(
                'Error de validación de datos',
                isProduction ? null : { 
                    validationErrors: error.errors || error.message 
                }
            );
        } 
        else if (error.name === 'CastError') {
            appError = new ValidationError(
                'ID inválido o formato incorrecto',
                isProduction ? null : { 
                    originalError: error.message 
                }
            );
        }
        else if (error.name === 'JsonWebTokenError') {
            appError = new AuthenticationError(
                'Token de autenticación inválido',
                isProduction ? null : { 
                    originalError: error.message 
                }
            );
        }
        else if (error.name === 'TokenExpiredError') {
            appError = new AuthenticationError(
                'Token de autenticación expirado',
                isProduction ? null : { 
                    originalError: error.message 
                }
            );
        }
        else if (error.name === 'MongoServerError' && error.code === 11000) {
            appError = new ConflictError(
                'Recurso duplicado',
                isProduction ? null : { 
                    duplicateKey: error.keyValue 
                }
            );
        }
        else if (error.sql || error.sqlMessage) {
            appError = new DatabaseError(
                'Error en la base de datos',
                isProduction ? null : { 
                    originalError: error.message,
                    sqlCode: error.code,
                    sqlMessage: error.sqlMessage
                }
            );
        }
        else {
            appError = new DatabaseError(
                isProduction ? 'Error interno del servidor' : error.message,
                isProduction ? null : { 
                    originalError: error.message,
                    stack: error.stack 
                }
            );
        }
    }

   
    const response = {
        success: false,
        error: appError.message,
        code: appError.errorCode,
        status: appError.statusCode,
        timestamp: appError.timestamp
    };

    // Add details only in production
    if (!isProduction && appError.details) {
        response.details = appError.details;
    }

    if (appError instanceof RateLimitError) {
        res.set('Retry-After', '60');
    }

    res.status(appError.statusCode).json(response);
};

module.exports = { errorHandler };