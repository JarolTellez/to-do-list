const isProduction = process.env.NODE_ENV === "production";

const getCookieDomain = () => {
  if (!isProduction) return undefined;

  const backendUrl = process.env.BACKEND_URL || process.env.RAILWAY_STATIC_URL;

  if (backendUrl) {
    try {
      const domain = new URL(backendUrl).hostname;
      console.log("Cookie domain:", domain);
      return domain;
    } catch (error) {
      console.warn("No se pudo parsear BACKEND_URL:", error);
    }
  }

  return undefined;
};

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  domain: getCookieDomain(),
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
};

const REFRESH_TOKEN_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

const ACCESS_TOKEN_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 minutos
};

const CLEAR_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: 0,
  expires: new Date(0),
};

module.exports = {
  REFRESH_TOKEN_OPTIONS,
  ACCESS_TOKEN_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
};
