const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  //secure: process.env.NODE_ENV === "production",
  // sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  sameSite: "none",
  path: "/",
};

const REFRESH_TOKEN_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
};

const ACCESS_TOKEN_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 minutos
};

const CLEAR_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 0,
};

module.exports = {
  COOKIE_OPTIONS,
  REFRESH_TOKEN_OPTIONS,
  ACCESS_TOKEN_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
};
