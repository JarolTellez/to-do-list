const { CLEAR_COOKIE_OPTIONS } = require("../config/cookiesConfig");

/**
 * Authentication cookie utilities for API layer cookie management
 * @module authCookieUtils
 * @description Provides utilities for clearing authentication cookies in API responses
 */

/**
 * Clears all authentication cookies from the response
 * @function clearAuthCookies
 * @param {Object} res - Express response object
 * @returns {void}
 */
const clearAuthCookies = (res) => {
  res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
  res.clearCookie("accessToken", CLEAR_COOKIE_OPTIONS);
};

module.exports = {
  clearAuthCookies,
};
