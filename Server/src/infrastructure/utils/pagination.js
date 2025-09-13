export const calculatePagination = (page, limit, maxLimit = 100, defaultPage = 1, defaultLimit = 10) => {
  const pageNum = Math.max(defaultPage, parseInt(page, 10) || defaultPage);
  let limitNum = parseInt(limit, 10) || defaultLimit;

  limitNum = Math.min(limitNum, maxLimit);
  limitNum = Math.max(1, limitNum);

  const offset = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    offset
  };
};

export const calculateTotalPages = (total, limit) => {
  return total > 0 ? Math.ceil(total / limit) : 0;
};

export const buildPaginationResponse = (data, paginationInfo, total, totalPages) => {
  return {
    [Array.isArray(data) ? 'tags' : 'items']: data,
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