/**
 * Sort validation constants defining allowed sort fields and orders for each entity
 * @namespace SORT_CONSTANTS
 * @description Centralized configuration for sort parameters to prevent SQL injection
 * and ensure only valid fields are used for sorting across all entities
 */
const SORT_CONSTANTS = {
  /**
   * Supported sort order directions
   * @type {Object}
   * @property {string} ASC - Ascending order
   * @property {string} DESC - Descending order
   */
  SORT_ORDER: {
    ASC: "asc",
    DESC: "desc",
  },

  /**
   * Entity-specific sort configuration
   * @type {Object}
   */
  ENTITIES: {
    /**
     * Task entity sort configuration
     * @type {Object}
     */
    TASK: {
      /**
       * Allowed sortable fields for tasks
       * @type {Object}
       */
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
      /**
       * Default sort settings for tasks
       * @type {Object}
       */
      DEFAULTS: {
        SORT_BY: "lastUpdateDate",
        SORT_ORDER: "desc",
      },
    },
    /**
     * Tag entity sort configuration
     * @type {Object}
     */
    TAG: {
      /**
       * Allowed sortable fields for tags
       * @type {Object}
       */
      FIELDS: {
        ID: "id",
        NAME: "name",
        DESCRIPTION: "description",
        CREATED_AT: "createdAt",
      },
      /**
       * Default sort settings for tags
       * @type {Object}
       */
      DEFAULTS: {
        SORT_BY: "name",
        SORT_ORDER: "asc",
      },
    },
    /**
     * User entity sort configuration
     * @type {Object}
     */
    USER: {
      /**
       * Allowed sortable fields for users
       * @type {Object}
       */
      FIELDS: {
        ID: "id",
        USER_NAME: "username",
        EMAIL: "email",
        CREATED_AT: "createdAt",
        UPDATED_AT: "updatedAt",
      },
      /**
       * Default sort settings for users
       * @type {Object}
       */
      DEFAULTS: {
        SORT_BY: "username",
        SORT_ORDER: "asc",
      },
    },
    /**
     * Session entity sort configuration
     * @type {Object}
     */
    SESSION: {
      /**
       * Allowed sortable fields for sessions
       * @type {Object}
       */
      FIELDS: {
        ID: "id",
        REFRESH_TOKEN_HASH: "refreshTokenHash",
        USER_AGENT: "userAgent",
        IP: "ip",
        EXPIRES_AT: "expiresAt",
        CREATED_AT: "createdAt",
      },
      /**
       * Default sort settings for sessions
       * @type {Object}
       */
      DEFAULTS: {
        SORT_BY: "createdAt",
        SORT_ORDER: "desc",
      },
    },
    /**
     * TaskTag relationship sort configuration
     * @type {Object}
     */
    TASK_TAG: {
      /**
       * Allowed sortable fields for task-tag relationships
       * @type {Object}
       */
      FIELDS: {
        ID: "id",
        CREATED_AT: "createdAt",
      },
      /**
       * Default sort settings for task-tag relationships
       * @type {Object}
       */
      DEFAULTS: {
        SORT_BY: "createdAt",
        SORT_ORDER: "asc",
      },
    },
    /**
     * UserTag relationship sort configuration
     * @type {Object}
     */
    USER_TAG: {
      /**
       * Allowed sortable fields for user-tag relationships
       * @type {Object}
       */
      FIELDS: {
        ID: "id",
        CREATED_AT: "createdAt",
      },
      /**
       * Default sort settings for user-tag relationships
       * @type {Object}
       */
      DEFAULTS: {
        SORT_BY: "createdAt",
        SORT_ORDER: "asc",
      },
    },
  },
};

module.exports = SORT_CONSTANTS;
