const { CLEAR_COOKIE_OPTIONS } = require("../config/cookiesConfig");

const clearAuthCookies = (res) => {
  res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
   res.clearCookie("accessToken", CLEAR_COOKIE_OPTIONS);
};

module.exports = {
  clearAuthCookies
};