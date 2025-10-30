const PAGINATION_CONFIG = require("../config/paginationConfig");

/**
 * Helper class for handling pagination calculations and response formatting
 * @class PaginationHelper
 */
class PaginationHelper {
  /**
   * Creates a new PaginationHelper instance
   * @param {Object} [paginationConfig=PAGINATION_CONFIG] - Pagination configuration object
   */
  constructor(paginationConfig = PAGINATION_CONFIG) {
    this.config = paginationConfig;
  }

  /**
   * Calculates pagination parameters based on input values
   * @param {number|string} page - Current page number
   * @param {number|string} limit - Number of items per page
   * @param {number} [maxLimit=this.config.MAX_LIMIT] - Maximum allowed items per page
   * @param {number} [defaultPage=this.config.DEFAULT_PAGE] - Default page number
   * @param {number} [defaultLimit=this.config.DEFAULT_LIMIT] - Default items per page
   * @returns {Object} Pagination information object
   * @returns {number} return.page - Current page number
   * @returns {number} return.limit - Number of items per page
   * @returns {number} return.offset - Database offset for query
   * @returns {number} return.maxLimit - Maximum allowed items per page
   */
  calculatePagination = (
    page,
    limit,
    maxLimit = this.config.MAX_LIMIT,
    defaultPage = this.config.DEFAULT_PAGE,
    defaultLimit = this.config.DEFAULT_LIMIT
  ) => {
    const pageNum = Math.max(defaultPage, parseInt(page, 10) || defaultPage);
    let limitNum = parseInt(limit, 10) || defaultLimit;

    limitNum = Math.min(limitNum, maxLimit);
    limitNum = Math.max(1, limitNum);

    const offset = (pageNum - 1) * limitNum;

    return {
      page: pageNum,
      limit: limitNum,
      offset,
      maxLimit,
    };
  };

  /**
   * Calculates the total number of pages based on total items and items per page
   * @param {number} total - Total number of items
   * @param {number} limit - Number of items per page
   * @returns {number} Total number of pages
   */
  calculateTotalPages = (total, limit) => {
    return total > 0 ? Math.ceil(total / limit) : 0;
  };

  /**
   * Builds a standardized pagination response object
   * @param {Array} data - Array of data items
   * @param {Object} paginationInfo - Pagination information from calculatePagination
   * @param {number} paginationInfo.page - Current page number
   * @param {number} paginationInfo.limit - Number of items per page
   * @param {number} paginationInfo.maxLimit - Maximum allowed items per page
   * @param {number} total - Total number of items
   * @param {number} totalPages - Total number of pages
   * @param {string} [itemsKey='items'] - Key name for the data array in response
   * @returns {Object} Standardized pagination response
   * @returns {Array} return[itemsKey] - Array of data items
   * @returns {Object} return.pagination - Pagination metadata
   * @returns {number} return.pagination.page - Current page number
   * @returns {number} return.pagination.limit - Number of items per page
   * @returns {number} return.pagination.total - Total number of items
   * @returns {number} return.pagination.totalPages - Total number of pages
   * @returns {boolean} return.pagination.hasNext - Whether there is a next page
   * @returns {boolean} return.pagination.hasPrev - Whether there is a previous page
   * @returns {number} return.pagination.maxLimit - Maximum allowed items per page
   */
  buildPaginationResponse = ({
    data,
    paginationInfo,
    total,
    additionalCounts = null,
    totalPages,
    itemsKey = "items"
 } ) => {
    const response = {
      [itemsKey]: data,
      pagination: {
        page: paginationInfo.page,
        limit: paginationInfo.limit,
        total,
        totalPages,
        hasNext: paginationInfo.page < totalPages,
        hasPrev: paginationInfo.page > 1,
        maxLimit: paginationInfo.maxLimit,
      },
    };

    if (additionalCounts && typeof additionalCounts === "object") {
      response.pagination.counts = additionalCounts;
    }

    return response;
  };
}

module.exports = PaginationHelper;
