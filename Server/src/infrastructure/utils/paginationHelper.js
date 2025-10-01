const PAGINATION_CONFIG = require('../config/paginationConfig');

class PaginationHelper {
  constructor(paginationConfig = PAGINATION_CONFIG) {
    this.config = paginationConfig;
  }

 calculatePagination = (
  page, 
  limit, 
  maxLimit = this.config.MAX_LIMIT, 
  defaultPage =  this.config.DEFAULT_PAGE, 
  defaultLimit =  this.config.DEFAULT_LIMIT
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
    maxLimit 
  };
};

calculateTotalPages = (total, limit) => {
  return total > 0 ? Math.ceil(total / limit) : 0;
};

 buildPaginationResponse = (
  data, 
  paginationInfo, 
  total, 
  totalPages,
  itemsKey = 'items' 
) => {
  return {
    [itemsKey]: data, 
    pagination: {
      page: paginationInfo.page,
      limit: paginationInfo.limit,
      total,
      totalPages,
      hasNext: paginationInfo.page < totalPages,
      hasPrev: paginationInfo.page > 1,
      maxLimit: paginationInfo.maxLimit
    }
  };
};
}

module.exports = PaginationHelper;
