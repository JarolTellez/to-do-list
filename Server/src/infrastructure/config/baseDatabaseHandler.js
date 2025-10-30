/**
 * Base class for database operations with common utilities and error handling
 * @class BaseDatabaseHandler
 */
class BaseDatabaseHandler {
  /**
   * Creates a new BaseDatabaseHandler instance
   * @param {Object} dependencies - Dependencies for database operations
   * @param {PrismaManager} dependencies.dbManager - Database manager instance
   * @param {ErrorFactory} dependencies.errorFactory - Error factory instance
   */
  constructor({ dbManager, errorFactory }) {
    this.dbManager = dbManager;
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
