const domainValidationConfig = {
  USER: {
    USERNAME: {
      MIN_LENGTH: 5,
      MAX_LENGTH: 30,
      ALLOWED_CHARS: /^[a-zA-Z0-9_\-.]*$/,
      ALLOWED_CHARS_DESCRIPTION: "letras, números, guiones bajos, guiones y puntos"
    },
    PASSWORD: {
      MIN_LENGTH: 6,
      MAX_LENGTH: 30
    },
    EMAIL: {
      MAX_LENGTH: 255
    },
    ROLE: {
      ALLOWED_VALUES: ["user", "admin"]
    }
  },
  

  TASK: {
    NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 60
    },
    DESCRIPTION: {
      MAX_LENGTH: 300
    },
    PRIORITY: {
      MIN: 1,
      MAX: 5
    },
    SCHEDULED_DATE: {
      MIN_FUTURE_MINUTES: 1 
    }
  },
  

  TAG: {
    NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 50
    },
    DESCRIPTION: {
      MAX_LENGTH: 500
    }
  },
  

  SESSION: {
    REFRESH_TOKEN_HASH: {
      EXACT_LENGTH: 64 
    },
    USER_AGENT: {
      MAX_LENGTH: 500
    },
    IP: {
      MAX_LENGTH: 45 
    },
    EXPIRATION: {
      DEFAULT_DURATION: "7d",
      MIN_DURATION: "1m"
    }
  },
  

  RELATIONSHIPS: {
    USER_TAG: {
      MAX_TAGS_PER_USER: 300
    },
    TASK_TAG: {
      MAX_TAGS_PER_TASK: 40
    },
    SESSION: {
      MAX_ACTIVE_SESSIONS: 40
    }
  },
  
  TEXT: {
    MIN_LENGTH: 1,
    MAX_LENGTH_GENERAL: 255
  }
};