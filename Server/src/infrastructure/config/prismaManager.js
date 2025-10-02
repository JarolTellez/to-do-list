const { PrismaClient } = require("@prisma/client");

class PrismaManager {
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

  get client() {
    return this.prisma;
  }

  async transaction(callback) {
    return this.prisma.$transaction(callback);
  }

  async withTransaction(callback, externalDbClient = null) {
    if (externalDbClient) {
      return callback(externalDbClient);
    }
    return this.prisma.$transaction(async (dbClient) => {
      return callback(dbClient);
    });
  }

  async forRead(callback, externalDbClient = null) {
    if (externalDbClient) {
      return callback(externalDbClient);
    }
    return callback(this.prisma);
  }

  static getInstance() {
    if (!PrismaManager.instance) {
      PrismaManager.instance = new PrismaManager();
    }
    return PrismaManager.instance;
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = PrismaManager;
