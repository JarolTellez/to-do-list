const { PrismaClient } = require("@prisma/client");

/**
 * Singleton manager for Prisma database client with transaction handling
 * @class PrismaManager
 */
class PrismaManager {
  /**
   * Creates a new PrismaManager instance (Singleton pattern)
   * @constructor
   */
  constructor() {
    if (PrismaManager.instance) {
      return PrismaManager.instance;
    }

    this.prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

    PrismaManager.instance = this;
  }

  /**
   * Gets the Prisma client instance
   * @returns {PrismaClient} Prisma client instance
   */
  get client() {
    return this.prisma;
  }

  /**
   * Executes a database transaction
   * @param {Function} callback - Transaction callback function
   * @returns {Promise<*>} Result of the transaction callback
   */
  async transaction(callback) {
    return this.prisma.$transaction(callback);
  }

  /**
   * Executes database operations within a transaction context
   * @param {Function} callback - Operation callback function
   * @param {Object} [externalDbClient=null] - External transaction client for nested transactions
   * @returns {Promise<*>} Result of the operation callback
   */
  async withTransaction(callback, externalDbClient = null) {
    if (externalDbClient) {
      return callback(externalDbClient);
    }
    return this.prisma.$transaction(async (dbClient) => {
      return callback(dbClient);
    });
  }

  /**
   * Executes read-only database operations
   * @param {Function} callback - Read operation callback function
   * @param {Object} [externalDbClient=null] - External database client
   * @returns {Promise<*>} Result of the read operation
   */
  async forRead(callback, externalDbClient = null) {
    if (externalDbClient) {
      return callback(externalDbClient);
    }
    return callback(this.prisma);
  }

  /**
   * Gets the singleton instance of PrismaManager
   * @static
   * @returns {PrismaManager} PrismaManager singleton instance
   */
  static getInstance() {
    if (!PrismaManager.instance) {
      PrismaManager.instance = new PrismaManager();
    }
    return PrismaManager.instance;
  }

  /**
   * Disconnects the Prisma client from the database
   * @returns {Promise<void>}
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = PrismaManager;
