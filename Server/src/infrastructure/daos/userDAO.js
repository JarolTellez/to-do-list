const BaseDatabaseHandler = require("../config/baseDatabaseHandler");
const { SORT_ORDER, USER_SORT_FIELD } = require("../constants/sortConstants");

/**
 * Data Access Object for User entity handling database operations
 * @class UserDAO
 * @extends BaseDatabaseHandler
 */
class UserDAO extends BaseDatabaseHandler {
  /**
   * Creates a new UserDAO instance
   * @param {Object} dependencies - Dependencies for UserDAO
   * @param {Object} dependencies.userMapper - Mapper for user data transformation from dbData to Domain
   * @param {Object} dependencies.dbManager - Database manager for connection handling (prisma)
   * @param {Object} dependencies.errorFactory - Factory for creating app errors
   * @param {Object} dependencies.inputValidator - Validator for parameters recived from services
   */
  constructor({ userMapper, dbManager, inputValidator, errorFactory }) {
    super({ dbManager, errorFactory });
    this.userMapper = userMapper;
    this.inputValidator = inputValidator;
  }

  /**
   * Creates a new user in the database
   * @param {User} user - User domain entity to create
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<User>} Created user domain entity
   * @throws {ValidationError} If user data is invalid
   * @throws {ConflictError} If username or email already exists
   * @throws {DatabaseError} On database operation failure
   */
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

  /**
   * Updates an existing user's basic information (Not password)
   * @param {User} userDomain - User domain entity with updated data
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<User>} Updated user domain entity
   * @throws {ValidationError} If user ID or data is invalid
   * @throws {NotFoundError} If user is not found
   * @throws {DatabaseError} On database operation failure
   */
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
          throw this.errorFactory.createNotFoundError(
            "Usuario no encontrado para actualizar",
            {
              userId: userDomain.id,
              prismaCode: error.code,
              operation: "userDAO.update",
            }
          );
        }
        this._handlePrismaError(error, "userDAO.update", {
          userId: userDomain.id,
        });
      }
    }, externalDbClient);
  }

  /**
   * Updates a user's password
   * @param {number|string} userId - ID of the user to update
   * @param {string} hashedPassword - New hashed password
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<User>} Updated user domain entity
   * @throws {ValidationError} If user ID is invalid
   * @throws {NotFoundError} If user is not found
   * @throws {DatabaseError} On database operation failure
   */
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
          throw this.errorFactory.createNotFoundError(
            "Usuario no encontrado para actualizar contraseña",
            {
              userId,
              prismaCode: error.code,
              operation: "userDAO.updatePassword",
            }
          );
        }
        this._handlePrismaError(error, "userDAO.updatePassword", {
          userId,
        });
      }
    }, externalDbClient);
  }

  /**
   * Deletes a user from the database
   * @param {number|string} id - ID of the user to delete
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<boolean>} True if deletion was successful
   * @throws {ValidationError} If user ID is invalid
   * @throws {ConflictError} If user has associated tasks or sessions
   * @throws {DatabaseError} On database operation failure
   */
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

  /**
   * Removes tags from a user
   * @param {number|string} userId - ID of the user
   * @param {number[]} tagIds - Array of tag IDs to remove
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<boolean>} True if removal was successful
   * @throws {ValidationError} If user ID or tag IDs are invalid
   * @throws {DatabaseError} On database operation failure
   */
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

  /**
   * Assigns tags to a usetr
   * @param {number|string} userId - ID of the user
   * @param {number[]} tagIds - Array of tag IDs to assign
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<User>} User domain entity with updated tags
   * @throws {ValidationError} If user ID or tag IDs are invalid
   * @throws {NotFoundError} If user is not found
   * @throws {DatabaseError} On database operation failure
   */
  async assignTags(userId, tagIds = [], externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        if (!Array.isArray(tagIds)) {
          throw this.errorFactory.createValidationError(
            "tagIds debe ser un array",
            {
              operation: "userDAO.assignTags",
              userId,
              actualType: typeof tagIds,
            }
          );
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

          if (!user) {
            throw this.errorFactory.createNotFoundError(
              "Usuario no encontrado",
              {
                userId,
                operation: "userDAO.assignTags",
              }
            );
          }

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
        if (error.code === "P2025") {
          throw this.errorFactory.createNotFoundError(
            "Usuario no encontrado para asignar etiquetas",
            {
              userId,
              prismaCode: error.code,
              operation: "userDAO.assignTags",
            }
          );
        }
        this._handlePrismaError(error, "userDAO.assignTags", {
          userId,
          tagIds,
        });
      }
    }, externalDbClient);
  }

  /**
   * Checks if a user has specific tags
   * @param {number|string} userId - ID of the user
   * @param {number[]} tagIds - Array of tag IDs to check
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<number[]>} Array of tag IDs that the user has
   * @throws {ValidationError} If user ID or tag IDs are invalid
   * @throws {DatabaseError} On database operation failure
   */
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

  /**
   * Finds a user by username
   * @param {string} username - Username to search for
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<User|null>} User domain entity if found, null otherwise
   * @throws {ValidationError} If username is invalid
   * @throws {DatabaseError} On database operation failure
   */
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

  /**
   * Finds a user by email
   * @param {string} email - Email to search for
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<User|null>} User domain entity if found, null otherwise
   * @throws {ValidationError} If email is invalid
   * @throws {DatabaseError} On database operation failure

   */
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

  /**
   * Finds a user by ID
   * @param {number|string} id - ID of the user to find
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<User|null>} User domain entity if found, null otherwise
   * @throws {ValidationError} If user ID is invalid
   * @throws {DatabaseError} On database operation failureF
   */
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

  /**
   * Finds a user by ID including their tags
   * @param {number|string} id - ID of the user to find
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<User|null>} User domain entity with tags if found, null otherwise
   * @throws {ValidationError} If user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
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

  /**
   * Finds all users with pagination and sorting
   * @param {Object} [options={}] - Query options
   * @param {Object} [options.externalDbClient=null] - External Prisma transaction client
   * @param {number} [options.limit=null] - Maximum number of users to return
   * @param {number} [options.offset=null] - Number of users to skip
   * @param {string} [options.sortBy=USER_SORT_FIELD.CREATED_AT] - Field to sort by
   * @param {string} [options.sortOrder=SORT_ORDER.DESC] - Sort order (ASC/DESC)
   * @returns {Promise<User[]>} Array of user domain entities
   * @throws {DatabaseError} On database operation failure
   */
  async findAll({
    externalDbClient = null,
    limit = null,
    offset = null,
    sortBy,
    sortOrder,
  } = {}) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
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
