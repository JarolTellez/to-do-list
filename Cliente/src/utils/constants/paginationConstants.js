export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
};

export const ENTITY_PAGINATION_LIMITS = {
  TASKS: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50
  },
  USERS: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },
  TAGS: {
    DEFAULT_LIMIT: 25,
    MAX_LIMIT: 200
  },
  SESSIONS: {
    DEFAULT_LIMIT: 15,
    MAX_LIMIT: 50
  }
};

export const PAGINATION_ERRORS = {
  INVALID_PAGE: 'El número de página debe ser mayor a 0',
  INVALID_LIMIT: 'El límite debe ser mayor a 0',
  EXCEEDED_MAX_LIMIT: 'El límite excede el máximo permitido para esta entidad'
};