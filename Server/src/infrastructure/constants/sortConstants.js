const SORT_CONSTANTS = {
  SORT_ORDER: {
    ASC: "asc",
    DESC: "desc",
  },

  ENTITIES: {
    TASK: {
      FIELDS: {
        ID: "id",
        NAME: "name",
        DESCRIPTION: "description",
        SCHEDULED_DATE: "scheduledDate",  
        IS_COMPLETED: "isCompleted",         
        PRIORITY: "priority",     
        CREATED_AT: "createdAt",          
        LAST_UPDATE_DATE: "lastUpdateDate",
      },
      DEFAULTS: {
        SORT_BY: "lastUpdateDate",
        SORT_ORDER: "desc"
      }
    },

    TAG: {
      FIELDS: {
        ID: "id",
        NAME: "name",
        DESCRIPTION: "description",
        CREATED_AT: "createdAt", 
      },
      DEFAULTS: {
        SORT_BY: "name",
        SORT_ORDER: "asc"
      }
    },

    USER: {
      FIELDS: {
        ID: "id",
        USER_NAME: "username",   
        EMAIL: "email",
        CREATED_AT: "createdAt",  
        UPDATED_AT: "updatedAt",  
      },
      DEFAULTS: {
        SORT_BY: "username",
        SORT_ORDER: "asc"
      }
    },

    SESSION: {
      FIELDS: {
        ID: "id",
        REFRESH_TOKEN_HASH: "refreshTokenHash", 
        USER_AGENT: "userAgent",                  
        IP: "ip",                          
        EXPIRES_AT: "expiresAt",                     
        CREATED_AT: "createdAt",          
      },
      DEFAULTS: {
        SORT_BY: "createdAt",
        SORT_ORDER: "desc"
      }
    },

    TASK_TAG: {
      FIELDS: {
        ID: "id", 
        CREATED_AT: "createdAt",          
      },
      DEFAULTS: {
        SORT_BY: "createdAt",
        SORT_ORDER: "asc"
      }
    },

    USER_TAG: {
      FIELDS: {
        ID: "id", 
        CREATED_AT: "createdAt",          
      },
      DEFAULTS: {
        SORT_BY: "createdAt",
        SORT_ORDER: "asc"
      }
    }
  }
};

module.exports = SORT_CONSTANTS;