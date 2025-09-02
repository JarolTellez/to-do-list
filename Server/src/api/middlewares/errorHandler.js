const {
  NotFoundError,          
  ValidationError,        
  DatabaseError,          
  AuthenticationError     
} = require('../../utils/appErrors');  

const errorHandler = (error, req, res, next) => {
      
    console.error('=== ERROR LOG ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=================');

    if (error instanceof NotFoundError) {
        return res.status(404).json({
            success: false,
            error: error.message,      
            code: error.name,        
            status: 404               
        });
    }

    if (error instanceof ValidationError) {
        return res.status(400).json({
            success: false,
            error: error.message,      
            code: error.name,          
            status: 400
        });
    }

    if (error instanceof DatabaseError) {
        return res.status(500).json({
            success: false,
            error: error.message,      
            code: error.name,          
            status: 500
        });
    }

    if (error instanceof AuthenticationError) {
        return res.status(401).json({
            success: false, 
            error: error.message,      
            code: error.name,          
            status: 401
        });
    }

    // Error generico
    return res.status(500).json({
        success: false,
        error: "Error interno del servidor",  
        code: "InternalServerError",          
        status: 500
    });
}

module.exports = { errorHandler };  