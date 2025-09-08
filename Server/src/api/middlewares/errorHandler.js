// const {
//   NotFoundError,          
//   ValidationError,        
//   DatabaseError,          
//   AuthenticationError,
//   AppError     
// } = require('../../utils/appErrors');  

// const isProduction = process.env.NODE_ENV === 'development';

// const errorHandler = (error, req, res, next) => {
//   console.error('=== ERROR LOG ===');
//   console.error('Timestamp:', new Date().toISOString());
//   console.error('Path:', req.path);
//   console.error('Method:', req.method);
//   console.error('Error Name:', error.name);
//   console.error('Error Message:', error.message);
//   console.error('Error Code:', error.errorCode || 'No especificado');
//   console.error('Stack:', error.stack);
//   console.error('=================');

 
//   if (!(error instanceof AppError)) {
//     error = new DatabaseError(
//       isProduction ? 'Error interno del servidor' : error.message,
//       isProduction ? null : { originalError: error.message }
//     );
//   }

//   // Determinar el mensaje de error para producción
//   const errorMessage = isProduction && error.statusCode >= 500 
//     ? 'Error interno del servidor' 
//     : error.message;

//   // Respuesta base
//   const response = {
//     success: false,
//     error: errorMessage,
//     code: error.errorCode || error.name,
//     status: error.statusCode,
//     timestamp: new Date().toISOString()
//   };

//   // Agregar detalles solo en desarrollo y si existen
//   if (!isProduction && error.details) {
//     response.details = error.details;
//   }


//   res.status(error.statusCode).json(response);
// }

// module.exports = { errorHandler };


const {
    NotFoundError,
    ValidationError,
    DatabaseError,
    AuthenticationError,
    AppError,
    ForbiddenError,
    RateLimitError,
    ServiceUnavailableError
} = require('../../utils/appErrors');

const isProduction = process.env.NODE_ENV === 'development';

const errorHandler = (error, req, res, next) => {
    // Log del error completo
    console.error('=== ERROR HANDLER LOG ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Path:', req.path);
    console.error('Method:', req.method);
    console.error('IP:', req.ip);
    console.error('User Agent:', req.get('User-Agent'));
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.errorCode || 'N/A');
    console.error('Status Code:', error.statusCode || 'N/A');
    console.error('Stack:', error.stack);
    console.error('=================');

    // Si el error no es una instancia de AppError, convertirlo
    if (!(error instanceof AppError)) {
        // Mapear errores comunes de base de datos
        if (error.name === 'ValidationError' || error.name === 'ValidatorError') {
            error = new ValidationError(
                'Error de validación de datos',
                isProduction ? null : { mongooseError: error.message }
            );
        } else if (error.name === 'CastError') {
            error = new ValidationError(
                'ID inválido',
                isProduction ? null : { originalError: error.message }
            );
        } else if (error.name === 'MongoServerError' && error.code === 11000) {
            error = new ConflictError(
                'Recurso duplicado',
                isProduction ? null : { duplicateKey: error.keyValue }
            );
        } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            error = new AuthenticationError(
                'Token inválido o expirado',
                isProduction ? null : { originalError: error.message }
            );
        } else {
            error = new DatabaseError(
                isProduction ? 'Error interno del servidor' : error.message,
                isProduction ? null : { 
                    originalError: error.message,
                    stack: error.stack 
                }
            );
        }
    }

    // Determinar mensaje para producción
    let errorMessage = error.message;
    if (isProduction && error.statusCode >= 500) {
        errorMessage = 'Error interno del servidor';
    }

    // Construir respuesta
    const response = {
        success: false,
        error: errorMessage,
        code: error.errorCode || error.name,
        status: error.statusCode,
        timestamp: error.timestamp || new Date().toISOString()
    };

    // Agregar detalles solo en desarrollo
    if (!isProduction && error.details) {
        response.details = error.details;
    }

    // Headers adicionales para ciertos errores
    if (error instanceof RateLimitError) {
        res.set('Retry-After', '60'); // 60 segundos
    }

    // Enviar respuesta
    res.status(error.statusCode).json(response);
};

module.exports = { errorHandler };