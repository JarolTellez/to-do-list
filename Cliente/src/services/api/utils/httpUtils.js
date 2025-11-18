import { ApiError } from "./apiError";

/**
 * Verifies response content type is JSON
 * @function verifyContentType
 * @param {Response} response - HTTP response
 * @returns {boolean} Whether content type is JSON
 */
export const verifyContentType = (response) => {
  const contentType = response.headers.get("content-type");
  return contentType && contentType.includes("application/json");
};

/**
 * Extracts error message from error data
 * @function extractErrorMessage
 * @param {Object} errorData - Error response data
 * @param {number} status - HTTP status code
 * @returns {string} Extracted error message
 */
export const extractErrorMessage = (errorData, status) => {
  return (
    errorData.message ||
    errorData.mensaje ||
    errorData.error ||
    `Error ${status}`
  );
};

/**
 * Handles error responses from API
 * @async
 * @function handleErrorResponse
 * @param {Response} response - HTTP error response
 * @returns {Promise<ApiError>} Structured API error
 */
export const handleErrorResponse = async (response) => {
  const status = response.status;

  try {
    if (verifyContentType(response)) {
      const errorData = await response.json();

      const errorMessage = extractErrorMessage(errorData, status);
      const errorCode = errorData.code || `HTTP_${status}`;

      return new ApiError(
        errorMessage,
        status,
        errorCode,
        errorData.details || {}
      );
    } else {
      const textResponse = await response.text();
      console.warn("Non-JSON server response:", textResponse.substring(0, 200));
      return new ApiError(
        `Error ${status}: Invalid server response`,
        status,
        `HTTP_${status}`,
        { rawResponse: textResponse.substring(0, 200) }
      );
    }
  } catch (parseError) {
    console.error("Error parsing error response:", parseError);
    return new ApiError(
      `Error ${status}: Could not process response`,
      status,
      `HTTP_${status}_PARSE_ERROR`,
      { parseError: parseError.message }
    );
  }
};

/**
 * Handles successful API responses
 * @async
 * @function handleApiResponse
 * @param {Response} response - HTTP response
 * @returns {Promise<Object>} Parsed response data
 * @throws {ApiError} When response is not OK or invalid
 */
export const handleApiResponse = async (response) => {
  try {
    if (!verifyContentType(response)) {
      const textResponse = await response.text();
      console.error(
        "Non-JSON server response:",
        textResponse.substring(0, 200)
      );
      throw new ApiError(
        "Invalid server response",
        500,
        "INVALID_RESPONSE_FORMAT",
        { rawResponse: textResponse.substring(0, 200) }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        extractErrorMessage(data, response.status),
        response.status,
        data.code || `HTTP_${response.status}`,
        data.details || {}
      );
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ApiError("Invalid server response", 500, "INVALID_JSON", {
        parseError: error.message,
      });
    }
    throw error;
  }
};

/**
 * Validates request parameters before sending
 * @function validateRequestParams
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {boolean} Whether parameters are valid
 * @throws {ApiError} When parameters are invalid
 */
export const validateRequestParams = (url, options) => {
  if (!url || typeof url !== "string") {
    throw new ApiError("URL must be a valid string", 400, "INVALID_URL");
  }

  if (
    options.body &&
    typeof options.body !== "string" &&
    !(options.body instanceof FormData)
  ) {
    throw new ApiError(
      "Request body must be string or FormData",
      400,
      "INVALID_BODY"
    );
  }

  return true;
};
