export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = "ApiError";
    this.status = status || 500;
    this.code = code || "UNKNOWN_ERROR";
    this.details = details || {};
    this.timestamp = new Date().toISOString();
    this.isOperational = true; 
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }


  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp
    };
  }

  static fromResponse(response, data) {
    return new ApiError(
      data.message || `HTTP ${response.status}`,
      response.status,
      data.code || `HTTP_${response.status}`,
      data.details || {}
    );
  }
}