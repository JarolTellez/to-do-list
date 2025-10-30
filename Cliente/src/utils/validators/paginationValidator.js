import {
  PAGINATION_DEFAULTS,
  ENTITY_PAGINATION_LIMITS,
  PAGINATION_ERRORS,
} from "../constants/paginationConstants";

export class PaginationValidator {
  static validate(entityType, page, limit) {
    const errors = [];

    const pageNumber = parseInt(page) || PAGINATION_DEFAULTS.PAGE;
    if (pageNumber < 1) {
      errors.push(PAGINATION_ERRORS.INVALID_PAGE);
    }

    const limitNumber = parseInt(limit) || this.getDefaultLimit(entityType);
    if (limitNumber < 1) {
      errors.push(PAGINATION_ERRORS.INVALID_LIMIT);
    }

    const maxLimit = this.getMaxLimit(entityType);
    if (limitNumber > maxLimit) {
      errors.push(`${PAGINATION_ERRORS.EXCEEDED_MAX_LIMIT}: ${maxLimit}`);
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return {
      page: pageNumber,
      limit: limitNumber,
      maxLimit: maxLimit,
    };
  }

  static validateParams(entityType, page, limit) {
    try {
      return this.validate(entityType, page, limit);
    } catch (error) {
      return {
        page: PAGINATION_DEFAULTS.PAGE,
        limit: this.getDefaultLimit(entityType),
        maxLimit: this.getMaxLimit(entityType),
      };
    }
  }

  static getDefaultLimit(entityType) {
    return (
      ENTITY_PAGINATION_LIMITS[entityType]?.DEFAULT_LIMIT ||
      PAGINATION_DEFAULTS.LIMIT
    );
  }

  static getMaxLimit(entityType) {
    return (
      ENTITY_PAGINATION_LIMITS[entityType]?.MAX_LIMIT ||
      PAGINATION_DEFAULTS.MAX_LIMIT
    );
  }
}