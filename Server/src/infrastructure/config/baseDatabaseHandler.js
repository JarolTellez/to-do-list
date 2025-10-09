/**
 * Base class for database operations with common utilities and error handling
 * @class BaseDatabaseHandler
 */
class BaseDatabaseHandler {
  /**
   * Creates a new BaseDatabaseHandler instance
   * @param {Object} dependencies - Dependencies for database operations
   * @param {PrismaManager} dependencies.dbManager - Database manager instance
   * @param {InputValidator} dependencies.inputValidator - Input validator instance
   * @param {ErrorFactory} dependencies.errorFactory - Error factory instance
   */
  constructor({ dbManager, inputValidator, errorFactory }) {
    this.dbManager = dbManager;
    this.inputValidator = inputValidator;
    this.errorFactory = errorFactory;
  }

  /**
   * Gets the appropriate Prisma client for database operations
   * @param {Object} [externalTx=null] - External transaction client
   * @returns {PrismaClient} Prisma client instance
   */
  async getPrisma(externalTx = null) {
    if (externalTx) return externalTx;
    return this.dbManager.getClient();
  }

  /**
   * Builds sort options for database queries
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - Sort order ('asc' or 'desc')
   * @param {Object} validSortFields - Object containing valid sort field values
   * @returns {Object} Prisma orderBy options object
   * @throws {ValidationError} If sort field or order is invalid
   */
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

  /**
   * Builds pagination options for database queries
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Number of records to skip
   * @returns {Object} Prisma pagination options object
   * @returns {number} [return.take] - Limit for records (if provided)
   * @returns {number} [return.skip] - Offset for records (if provided)
   */
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

  /**
   * Handles Prisma errors and converts them to app specific errors
   * @param {Error} error - Prisma error object
   * @param {string} context - Context where the error occurred
   * @param {Object} [metadata={}] - Additional error metadata
   * @throws {ConflictError} For duplicate entry errors (P2002)
   * @throws {NotFoundError} For record not found errors (P2025)
   * @throws {DatabaseError} For all other database errors
   */
  _handlePrismaError(error, context, metadata = {}) {
    if (error.code === "P2002") {
      throw this.errorFactory.createConflictError("Entrada duplicada", {
        ...metadata,
        prismaCode: error.code,
        target: error.meta?.target,
      });
    }

    if (error.code === "P2025") {
      throw this.errorFactory.createNotFoundError("Recurso no encontrado", {
        ...metadata,
        prismaCode: error.code,
      });
    }

    throw this.errorFactory.createDatabaseError(
      `Error en operación de base de datos: ${context}`,
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
