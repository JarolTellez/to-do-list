const BaseDatabaseHandler = require("../config/baseDatabaseHandler");
const { SORT_ORDER, USER_SORT_FIELD } = require("../constants/sortConstants");

class UserDAO extends BaseDatabaseHandler {
  constructor({ userMapper, dbManager, errorFactory, inputValidator }) {
    super({ dbManager, inputValidator, errorFactory });
    this.userMapper = userMapper;
  }

  async create(user, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const createdUser = await dbClient.user.create({
          data: {
            username: user.username,
            email: user.email.toLowerCase().trim(),
            password: user.password,
            rol: user.rol || "user",
          },
        });

        return this.userMapper.dbToDomain(createdUser);
      } catch (error) {
        this._handlePrismaError(error, "userDAO.create", {
          attemptedData: { username: user.username, email: user.email },
        });
      }
    }, externalDbClient);
  }

  async update(userDomain, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(
          userDomain.id,
          "user id"
        );

        const updatedUser = await dbClient.user.update({
          where: { id: userIdNum },
          data: {
            username: userDomain.username,
            email: userDomain.email?.toLowerCase().trim(),
          },
        });

        return this.userMapper.dbToDomain(updatedUser);
      } catch (error) {
        if (error.code === "P2025") {
          return null;
        }
        this._handlePrismaError(error, "userDAO.update", {
          userId: userDomain.id,
        });
      }
    }, externalDbClient);
  }

  async updatePassword(userId, hashedPassword, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        const updatedUser = await dbClient.user.update({
          where: { id: userIdNum },
          data: {
            password: hashedPassword,
          },
        });

        return this.userMapper.dbToDomain(updatedUser);
      } catch (error) {
        if (error.code === "P2025") {
          return null;
        }
        this._handlePrismaError(error, "userDAO.updatePassword", {
          userId,
        });
      }
    }, externalDbClient);
  }

  async delete(id, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(id, "user id");
        const result = await dbClient.user.delete({
          where: { id: userIdNum },
        });

        return true;
      } catch (error) {
        if (error.code === "P2003") {
          throw this.errorFactory.createConflictError(
            "Cannot delete user: user has associated tasks or sessions",
            { attemptedData: { userId: id } }
          );
        }
        this._handlePrismaError(error, "userDAO.delete", { userId: id });
      }
    }, externalDbClient);
  }

  async removeTags(userId, tagIds = [], externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        await dbClient.userTag.deleteMany({
          where: {
            userId: userIdNum,
            tagId: {
              in: tagIds,
            },
          },
        });

        return true;
      } catch (error) {
        this._handlePrismaError(error, "userDAO.removeTags", {
          userId,
          tagIds,
        });
      }
    }, externalDbClient);
  }

  async assignTags(userId, tagIds = [], externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        if (!Array.isArray(tagIds)) {
          throw new Error("tagIds must be an array");
        }

        const validTagIds = tagIds.filter(
          (tagId) => Number.isInteger(tagId) && tagId > 0
        );

        if (validTagIds.length === 0) {
          const user = await dbClient.user.findUnique({
            where: { id: userIdNum },
            include: {
              userTags: {
                include: {
                  tag: true,
                },
              },
            },
          });
          return this.userMapper.dbToDomainWithTags(user);
        }

        await dbClient.userTag.createMany({
          data: validTagIds.map((tagId) => ({
            userId: userIdNum,
            tagId: tagId,
          })),
          skipDuplicates: true,
        });

        const userWithTags = await dbClient.user.findUnique({
          where: { id: userIdNum },
          include: {
            userTags: {
              include: {
                tag: true,
              },
            },
          },
        });

        return this.userMapper.dbToDomainWithTags(userWithTags);
      } catch (error) {
        console.error("Error en assignTags:", error);
        this._handlePrismaError(error, "userDAO.assignTags", {
          userId,
          tagIds,
        });
      }
    }, externalDbClient);
  }

  async hasTags(userId, tagIds = [], externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        const userTags = await dbClient.userTag.findMany({
          where: {
            userId: userIdNum,
            tagId: {
              in: tagIds,
            },
          },
          select: {
            tagId: true,
          },
        });

        return userTags.map((ut) => ut.tagId);
      } catch (error) {
        this._handlePrismaError(error, "userDAO.hasTags", { userId, tagIds });
      }
    }, externalDbClient);
  }

  async findByUsername(username, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        if (typeof username !== "string" || username.trim().length === 0) {
          throw this.errorFactory.createValidationError("Invalid username");
        }

        const cleanUsername = username.trim();
        const user = await dbClient.user.findUnique({
          where: { username: cleanUsername },
        });

        return user ? this.userMapper.dbToDomain(user) : null;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "userDAO.findByUsername", { username });
      }
    }, externalDbClient);
  }

  async findByEmail(email, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        if (typeof email !== "string" || email.trim().length === 0) {
          throw this.errorFactory.createValidationError("Invalid email");
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await dbClient.user.findUnique({
          where: { email: cleanEmail },
        });

        return user ? this.userMapper.dbToDomain(user) : null;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "userDAO.findByEmail", { email });
      }
    }, externalDbClient);
  }

  async findById(id, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(id, "user id");
        const user = await dbClient.user.findUnique({
          where: { id: userIdNum },
        });

        return user ? this.userMapper.dbToDomain(user) : null;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "userDAO.findById", { userId: id });
      }
    }, externalDbClient);
  }

  async findByIdWithUserTags(id, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(id, "user id");
        const user = await dbClient.user.findUnique({
          where: { id: userIdNum },
          include: {
            userTags: {
              include: {
                tag: true,
              },
            },
          },
        });

        return user ? this.userMapper.dbToDomainWithTags(user) : null;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "userDAO.findByIdWithUserTags", {
          userId: id,
        });
      }
    }, externalDbClient);
  }

  async findAll({
    externalDbClient = null,
    limit = null,
    offset = null,
    sortBy = USER_SORT_FIELD.CREATED_AT,
    sortOrder = SORT_ORDER.DESC,
  } = {}) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const sortOptions = this._buildSortOptions(
          sortBy,
          sortOrder,
          USER_SORT_FIELD
        );
        const paginationOptions = this._buildPaginationOptions(limit, offset);

        const users = await dbClient.user.findMany({
          ...sortOptions,
          ...paginationOptions,
        });

        return users.map((user) => this.userMapper.dbToDomain(user));
      } catch (error) {
        this._handlePrismaError(error, "userDAO.findAll", {
          limit,
          offset,
          sortBy,
          sortOrder,
        });
      }
    }, externalDbClient);
  }
}

module.exports = UserDAO;
