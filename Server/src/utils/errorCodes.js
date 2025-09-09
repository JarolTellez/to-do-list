module.exports = {
    // Errores generales del servidor
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    DATABASE_ERROR: 'DATABASE_ERROR',

    // Errores de autenticación / autorización
    UNAUTHORIZED: 'UNAUTHORIZED',       // 401
    FORBIDDEN: 'FORBIDDEN',             // 403
    INVALID_TOKEN: 'INVALID_TOKEN',

    // Errores de negocio / validación
    VALIDATION_ERROR: 'VALIDATION_ERROR', 
    CONFLICT: 'CONFLICT',               // 409
    NOT_FOUND: 'NOT_FOUND',             // 404

    // Límite de peticiones
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED', // 429
};
