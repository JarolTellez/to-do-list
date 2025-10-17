const BaseDatabaseHandler = require("../config/baseDatabaseHandler");
const { TAG_SORT_FIELD } = require("../constants/sortConstants");

/**
 * Data Access Object for Tag entity handling database operations
 * @class TagDAO
 * @extends BaseDatabaseHandler
 */
class TagDAO extends BaseDatabaseHandler {
  /**
   * Creates a new TagDAO instance
   * @param {Object} dependencies - Dependencies for TagDAO
   * @param {Object} dependencies.tagMapper - Mapper for tag data transformation from dbData to domain
   * @param {Object} dependencies.dbManager - Database manager for connection handling (prisma)
   * @param {Object} dependencies.errorFactory - Factory for creating app errors
   * @param {Object} dependencies.inputValidator - Validator for parameters recived from services
   */
  constructor({ tagMapper, dbManager,inputValidator, errorFactory}) {
    super({ dbManager,errorFactory });
    this.inputValidator = inputValidator;
    this.tagMapper = tagMapper;
  }

  /**
   * Creates a new tag in the database
   * @param {Tag} tag - Tag domain entity to create
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Tag>} Created tag domain entity
   * @throws {ValidationError} If tag data is invalid
   * @throws {ConflictError} If tag name already exists
   * @throws {DatabaseError} On database operation failure
   */
  async create(tag, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const createdTag = await dbClient.tag.create({
          data: {
            name: tag.name,
            description: tag.description,
          },
        });

        return this.tagMapper.dbToDomain(createdTag);
      } catch (error) {
        if (error.code === "P2002") {
          throw this.errorFactory.createConflictError(
            "A tag with this name already exists",
            { name: tag.name }
          );
        }
        this._handlePrismaError(error, "tagDAO.create", { name: tag.name });
      }
    }, externalDbClient);
  }

  /**
   * Updates an existing tag's information
   * @param {Tag} tagDomain - Tag domain entity with updated data
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Tag>} Updated tag domain entity
   * @throws {ValidationError} If tag ID is invalid
   * @throws {NotFoundError} If tag is not found
   * @throws {ConflictError} If tag name already exists
   * @throws {DatabaseError} On database operation failure
   */
  async update(tagDomain, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const tagIdNum = this.inputValidator.validateId(tagDomain.id, "tag id");

        const updatedTag = await dbClient.tag.update({
          where: { id: tagIdNum },
          data: {
            name: tagDomain.name,
            description: tagDomain.description,
          },
        });

        return this.tagMapper.dbToDomain(updatedTag);
      } catch (error) {
        if (error.code === "P2025") {
          throw this.errorFactory.createNotFoundError(
            "Tag no encontrado para actualizar",
            {
              tagId: tagDomain.id,
              prismaCode: error.code,
              operation: "tagDAO.update",
            }
          );
        }
        if (error.code === "P2002") {
          throw this.errorFactory.createConflictError(
            "Ya existe un tag con este nombre",
            { name: tagDomain.name }
          );
        }
        this._handlePrismaError(error, "tagDAO.update", {
          tagId: tagDomain.id,
        });
      }
    }, externalDbClient);
  }

  /**
   * Deletes a tag from the database
   * @param {number|string} id - ID of the tag to delete
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<boolean>} True if deletion was successful
   * @throws {ValidationError} If tag ID is invalid
   * @throws {NotFoundError} If tag is not found
   * @throws {ConflictError} If tag has associated tasks or users
   * @throws {DatabaseError} On database operation failure
   */
  async delete(id, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        const tagIdNum = this.inputValidator.validateId(id, "tag id");

        await dbClient.tag.delete({
          where: { id: tagIdNum },
        });

        return true;
      } catch (error) {
        if (error.code === "P2025") {
          throw this.errorFactory.createNotFoundError(
            "Tag no encontrado para eliminar",
            {
              tagId: id,
              prismaCode: error.code,
              operation: "tagDAO.delete",
            }
          );
        }
        if (error.code === "P2003") {
          throw this.errorFactory.createConflictError(
            "No se puede eliminar el tag: tiene tareas o usuarios asociados",
            { tagId: id }
          );
        }
        this._handlePrismaError(error, "tagDAO.delete", { tagId: id });
      }
    }, externalDbClient);
  }

  /**
   * Creates multiple tags in the database (upsert operation)
   * @param {Tag[]} tagDomains - Array of tag domain entities to create
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Tag[]>} Array of created tag domain entities
   * @throws {ValidationError} If tag data is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async createMultiple(tagDomains = [], externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      try {
        if (!Array.isArray(tagDomains)) {
          throw this.errorFactory.createValidationError(
            "Tags must be an array"
          );
        }

        const validTagDomains = tagDomains.filter(
          (tag) => tag && tag.name && typeof tag.name === "string"
        );

        if (validTagDomains.length === 0) {
          return [];
        }

        const createdTags = [];
        for (const tagDomain of validTagDomains) {
          try {
            const created = await dbClient.tag.upsert({
              where: { name: tagDomain.name },
              update: {},
              create: {
                name: tagDomain.name,
                description: tagDomain.description,
              },
            });
            createdTags.push(this.tagMapper.dbToDomain(created));
          } catch (error) {
            if (error.code === "P2002") {
              const existing = await dbClient.tag.findUnique({
                where: { name: tagDomain.name },
              });
              if (existing) {
                createdTags.push(this.tagMapper.dbToDomain(existing));
                continue;
              }
            }
            throw error;
          }
        }

        return createdTags;
      } catch (error) {
        this._handlePrismaError(error, "tagDAO.createMultiple", {
          tags: tagDomains.map((t) => t.toJSON()),
        });
      }
    }, externalDbClient);
  }

  /**
   * Finds a tag by name
   * @param {string} name - Name of the tag to find
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Tag|null>} Tag domain entity if found, null otherwise
   * @throws {ValidationError} If tag name is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findByName(name, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        if (!name || typeof name !== "string") {
          throw this.errorFactory.createValidationError("Invalid tag name");
        }

        const tag = await dbClient.tag.findUnique({
          where: { name: name.trim() },
        });

        return tag ? this.tagMapper.dbToDomain(tag) : null;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "tagDAO.findByName", { name });
      }
    }, externalDbClient);
  }

  /**
   * Finds tags by names
   * @param {string[]} names - Array of tag names to find
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Tag[]>} Array of tag domain entities
   * @throws {ValidationError} If names parameter is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findByNames(names = [], externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        if (!Array.isArray(names)) {
          throw this.errorFactory.createValidationError(
            "Names must be an array"
          );
        }

        const validNames = names
          .filter((name) => name && typeof name === "string")
          .map((name) => name.trim())
          .filter((name) => name.length > 0);

        if (validNames.length === 0) {
          return [];
        }

        const tags = await dbClient.tag.findMany({
          where: {
            name: {
              in: validNames,
            },
          },
        });

        return tags.map((tag) => this.tagMapper.dbToDomain(tag));
      } catch (error) {
        this._handlePrismaError(error, "tagDAO.findByNames", { names });
      }
    }, externalDbClient);
  }

  /**
   * Finds tags by IDs
   * @param {number[]} tagIds - Array of tag IDs to find
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<Tag[]>} Array of tag domain entities
   * @throws {ValidationError} If tag IDs are invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findByIds(tagIds = [], externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        if (!Array.isArray(tagIds)) {
          throw this.errorFactory.createValidationError(
            "tagIds debe ser un arreglo",
            {
              operation: "tagDAO.findByIds",
              actualType: typeof tagIds,
            }
          );
        }
        const validTagIds = tagIds
          .map((tagId) => this.inputValidator.validateId(tagId, "tag id"))
          .filter((id) => id !== null);

        if (validTagIds.length === 0) {
          return [];
        }

        const tags = await dbClient.tag.findMany({
          where: {
            id: {
              in: validTagIds,
            },
          },
        });

        return tags.map((tag) => this.tagMapper.dbToDomain(tag));
      } catch (error) {
        this._handlePrismaError(error, "tagDAO.findByIds", { tagIds });
      }
    }, externalDbClient);
  }

  /**
   * Finds all tags associated with a user with pagination and sorting
   * @param {Object} options - Query options
   * @param {number|string} options.userId - ID of the user
   * @param {Object} [options.externalDbClient=null] - External Prisma transaction client
   * @param {number} [options.limit=null] - Maximum number of tags to return
   * @param {number} [options.offset=null] - Number of tags to skip
   * @param {string} [options.sortBy=TAG_SORT_FIELD.CREATED_AT] - Field to sort by
   * @param {string} [options.sortOrder="desc"] - Sort order (asc/desc)
   * @returns {Promise<Tag[]>} Array of tag domain entities
   * @throws {ValidationError} If user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async findAllByUserId({
    userId,
    externalDbClient = null,
    limit = null,
    offset = null,
    sortBy,
    sortOrder,
  } = {}) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

         const sortOptions = sortBy?{
          orderBy:{
            [sortBy]: sortOrder.toLowerCase()
          }
        }:{};
        const paginationOptions = this._buildPaginationOptions(limit, offset);

        const tags = await dbClient.tag.findMany({
          where: {
            userTags: {
              some: {
                userId: userIdNum,
              },
            },
          },
          ...sortOptions,
          ...paginationOptions,
        });

        return tags.map((tag) => this.tagMapper.dbToDomain(tag));
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "tagDAO.findAllByUserId", {
          userId,
          limit,
          offset,
        });
      }
    }, externalDbClient);
  }

  /**
   * Counts tags associated with a user
   * @param {number|string} userId - ID of the user
   * @param {Object} [externalDbClient=null] - External Prisma transaction client
   * @returns {Promise<number>} Number of tags associated with the user
   * @throws {ValidationError} If user ID is invalid
   * @throws {DatabaseError} On database operation failure
   */
  async countByUserId(userId, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        const count = await dbClient.tag.count({
          where: {
            userTags: {
              some: {
                userId: userIdNum,
              },
            },
          },
        });

        return count;
      } catch (error) {
        if (error instanceof this.errorFactory.Errors.ValidationError) {
          throw error;
        }
        this._handlePrismaError(error, "tagDAO.countByUserId", {
          userId,
        });
      }
    }, externalDbClient);
  }
}

module.exports = TagDAO;
