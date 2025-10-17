import { refreshAccessToken } from "./auth.js";
import {
  setAccessToken,
  getAccessToken,
  removeAccessToken,
} from "../utils/tokenStorage.js";
import { API_CONFIG } from "./api.js";

const API_BASE_URL = API_CONFIG.BASE_URL;
const MAX_REINTENTOS = API_CONFIG.MAX_REINTENTOS;

class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

const verificarContentType = (response) => {
  const contentType = response.headers.get("content-type");
  return contentType && contentType.includes("application/json");
};

const obtenerMensajeError = (errorData, status) => {
  return (
    errorData.message ||
    errorData.mensaje ||
    errorData.error ||
    `Error ${status}`
  );
};

const manejarErrorDeRespuesta = async (response) => {
  const status = response.status;

  try {
    if (verificarContentType(response)) {
      const errorData = await response.json();

      const mensajeError = obtenerMensajeError(errorData, status);

      return new ApiError(
        mensajeError,
        status,
        errorData.code || `HTTP_${status}`,
        errorData.details || {}
      );
    } else {
      const textResponse = await response.text();
      console.warn(
        "Respuesta no JSON del servidor:",
        textResponse.substring(0, 200)
      );
      return new ApiError(
        `Error ${status}: Respuesta del servidor no válida`,
        status,
        `HTTP_${status}`,
        { rawResponse: textResponse.substring(0, 200) }
      );
    }
  } catch (parseError) {
    console.error("Error parseando respuesta de error:", parseError);
    return new ApiError(
      `Error ${status}: No se pudo procesar la respuesta`,
      status,
      `HTTP_${status}_PARSE_ERROR`,
      { parseError: parseError.message }
    );
  }
};

export async function fetchConRenovacionAccessToken(url, opciones = {}) {
  let accessToken = getAccessToken();
  let reintentos = 0;

  if (!accessToken) {
    try {
      const data = await refreshAccessToken();
      setAccessToken(data.accessToken);
      accessToken = data.accessToken;
    } catch (error) {
      console.error("Error obteniendo token inicial:", error);
      redirigirALogin();
      throw new ApiError(
        "No se pudo obtener token de acceso inicial",
        401,
        "INITIAL_TOKEN_FAILED",
        { originalError: error.message }
      );
    }
  }

  while (reintentos <= MAX_REINTENTOS) {
    try {
      const response = await realizarPeticion(url, opciones, accessToken);

      if (response.ok) {
        return response;
      }

      const status = response.status;

      if (status === 401 && reintentos < MAX_REINTENTOS) {
        try {
          const dataRenovacion = await refreshAccessToken();
          setAccessToken(dataRenovacion.accessToken);
          accessToken = dataRenovacion.accessToken;
          reintentos++;
          continue;
        } catch (refreshError) {
          console.error("Error renovando token:", refreshError);
          removeAccessToken();
          redirigirALogin();
          throw new ApiError(
            "Error renovando token de acceso",
            401,
            "TOKEN_REFRESH_FAILED",
            { originalError: refreshError.message }
          );
        }
      }

      const error = await manejarErrorDeRespuesta(response);
      throw error;
    } catch (error) {
      if (error instanceof ApiError || reintentos >= MAX_REINTENTOS) {
        if (error.status === 401) {
          removeAccessToken();
          redirigirALogin();
        }
        throw error;
      }

      reintentos++;
    }
  }

  throw new ApiError(
    "Error de autenticación persistente",
    401,
    "PERSISTENT_AUTH_ERROR",
    { maxReintentos: MAX_REINTENTOS }
  );
}

async function realizarPeticion(url, opciones, accessToken) {
  const opcionesDefault = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...opciones.headers,
    },
  };

  const urlCompleta = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  const response = await fetch(urlCompleta, {
    ...opcionesDefault,
    ...opciones,
    headers: {
      ...opcionesDefault.headers,
      ...opciones.headers,
    },
  });

  return response;
}

export async function manejarRespuestaApi(response) {
  try {
    if (!verificarContentType(response)) {
      const textResponse = await response.text();
      console.error(
        "Respuesta no JSON del servidor:",
        textResponse.substring(0, 200)
      );
      throw new ApiError(
        "Respuesta del servidor no válida",
        500,
        "INVALID_RESPONSE_FORMAT",
        { rawResponse: textResponse.substring(0, 200) }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        obtenerMensajeError(data, response.status),
        response.status,
        data.code || `HTTP_${response.status}`,
        data.details || {}
      );
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ApiError(
        "Respuesta del servidor no válida",
        500,
        "INVALID_JSON",
        { parseError: error.message }
      );
    }
    throw error;
  }
}

function redirigirALogin() {
  console.warn("Redirigiendo a login...");
  removeAccessToken();
  sessionStorage.clear();
  localStorage.removeItem("rememberMe");
  window.location.replace("/");
}

const crearMetodoHttp =
  (method) =>
  async (url, data = null, opciones = {}) => {
    const config = {
      ...opciones,
      method: method.toUpperCase(),
      headers: {
        ...opciones.headers,
      },
    };

    if (method.toUpperCase() === "GET" && data && data.params) {
      const queryParams = new URLSearchParams();
      Object.entries(data.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      const queryString = queryParams.toString();
      url = queryString ? `${url}?${queryString}` : url;

      data = null;
    }

    if (data !== null && method.toUpperCase() !== "GET") {
      if (data instanceof FormData) {
        config.body = data;
        delete config.headers["Content-Type"];
      } else {
        config.body = JSON.stringify(data);
        config.headers["Content-Type"] = "application/json";
      }
    }

    try {
      const response = await fetchConRenovacionAccessToken(url, config);
      return await manejarRespuestaApi(response);
    } catch (error) {
      console.error(`Error en ${method.toUpperCase()} ${url}:`, error);
      throw error;
    }
  };

export const api = {
  get: crearMetodoHttp("GET"),
  post: crearMetodoHttp("POST"),
  put: crearMetodoHttp("PUT"),
  patch: crearMetodoHttp("PATCH"),
  delete: crearMetodoHttp("DELETE"),
};

export const ApiUtils = {
  esErrorAutenticacion: (error) => {
    return (
      error.status === 401 ||
      error.code?.includes("AUTH") ||
      error.code?.includes("TOKEN")
    );
  },

  esErrorRed: (error) => {
    return (
      error.name === "TypeError" && error.message.includes("Failed to fetch")
    );
  },

  esErrorTimeout: (error) => {
    return error.code === "REQUEST_TIMEOUT" || error.name === "AbortError";
  },

  obtenerMensajeAmigable: (error) => {
    if (error instanceof ApiError) {
      return error.message;
    }

    if (error.message.includes("Failed to fetch")) {
      return "Error de conexión. Verifique su internet.";
    }

    if (error.message.includes("Timeout")) {
      return "La petición tardó demasiado. Intente nuevamente.";
    }

    return error.message || "Error desconocido";
  },
};
