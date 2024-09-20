class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  
  const handleErrors = (err, req, res, next) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
  
  module.exports = { AppError, handleErrors };