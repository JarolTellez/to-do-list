class BaseDatabaseHandler {
  constructor({connectionDb, inputValidator, errorFactory}) {
    this.connectionDb = connectionDb;
    this.inputValidator = inputValidator;
    this.errorFactory = errorFactory;
  }


  async getPrisma(externalTx = null) {
    if (externalTx) return externalTx;
    return this.connectionDb.getClient();
  }


  _buildSortOptions(sortBy, sortOrder, validSortFields) {
  if (!sortBy || !validSortFields) return {};

  const { safeField } = this.inputValidator.validateSortField(
    sortBy,
    validSortFields,
    "sort field"
  );
  const { safeOrder } = this.inputValidator.validateSortOrder(sortOrder);

  return {
    orderBy: {
      [safeField]: safeOrder.toLowerCase(),
    },
  };
}

  _buildPaginationOptions(limit, offset) {
    const options = {};

    if (limit !== null && limit !== undefined) {
      options.take = parseInt(limit);
    }
    if (offset !== null && offset !== undefined) {
      options.skip = parseInt(offset);
    }

    return options;
  }

  _handlePrismaError(error, context, metadata = {}) {
    if (error.code === "P2002") {
      throw this.errorFactory.createConflictError("Duplicate entry", {
        ...metadata,
        prismaCode: error.code,
        target: error.meta?.target,
      });
    }

    if (error.code === "P2025") {
      throw this.errorFactory.createNotFoundError("Record not found", {
        ...metadata,
        prismaCode: error.code,
      });
    }

    throw this.errorFactory.createDatabaseError(
      `Database operation failed: ${context}`,
      {
        ...metadata,
        originalError: error.message,
        prismaCode: error.code,
        context,
      }
    );
  }
}

module.exports = BaseDatabaseHandler;
