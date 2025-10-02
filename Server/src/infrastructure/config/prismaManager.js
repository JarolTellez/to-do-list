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

  async withTransaction(callback, transactionClient = null) {
    if (transactionClient) {
      return callback(transactionClient);
    }
    return this.prisma.$transaction(async (tx) => {
      return callback(tx);
    });
  }

  async forRead(callback, readClient = null) {
    if (readClient) {
      return callback(readClient);
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
