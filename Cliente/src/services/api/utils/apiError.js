/**
 * Custom API error class for standardized error handling
 * @class ApiError
 * @extends Error
 * @description Provides structured error information for API responses
 */
export class ApiError extends Error {
  /**
   * Creates a new ApiError instance
   * @constructor
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {string} code - Error code for programmatic handling
   * @param {Object} details - Additional error details
   */
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

  /**
   * Converts error to JSON for serialization
   * @function toJSON
   * @returns {Object} JSON representation of error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  /**
   * Creates ApiError from HTTP response
   * @static
   * @function fromResponse
   * @param {Response} response - HTTP response object
   * @param {Object} data - Response data
   * @returns {ApiError} ApiError instance
   */
  static fromResponse(response, data) {
    return new ApiError(
      data.message || `HTTP ${response.status}`,
      response.status,
      data.code || `HTTP_${response.status}`,
      data.details || {}
    );
  }
}
