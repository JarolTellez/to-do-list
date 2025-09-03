const {
  NotFoundError,          
  ValidationError,        
  DatabaseError,          
  AuthenticationError,
  AppError     
} = require('../../utils/appErrors');  

const isProduction = process.env.NODE_ENV === "production";

const errorHandler = (error, req, res, next) => {
  console.error('=== ERROR LOG ===');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Error Name:', error.name);
  console.error('Error Message:', error.message);
  console.error('Error Code:', error.errorCode || 'No especificado');
  console.error('Stack:', error.stack);
  console.error('=================');

 
  if (!(error instanceof AppError)) {
    error = new DatabaseError(
      isProduction ? 'Error interno del servidor' : error.message,
      isProduction ? null : { originalError: error.message }
    );
  }

  // Determinar el mensaje de error para producción
  const errorMessage = isProduction && error.statusCode >= 500 
    ? 'Error interno del servidor' 
    : error.message;

  // Respuesta base
  const response = {
    success: false,
    error: errorMessage,
    code: error.errorCode || error.name,
    status: error.statusCode,
    timestamp: new Date().toISOString()
  };

  // Agregar detalles solo en desarrollo y si existen
  if (!isProduction && error.details) {
    response.details = error.details;
  }


  res.status(error.statusCode).json(response);
}

module.exports = { errorHandler };