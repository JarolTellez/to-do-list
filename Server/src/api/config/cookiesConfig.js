const isProduction = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",

};

const REFRESH_TOKEN_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const ACCESS_TOKEN_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000,
};

const CLEAR_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 0,
};

module.exports = {
  REFRESH_TOKEN_OPTIONS,
  ACCESS_TOKEN_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
};
