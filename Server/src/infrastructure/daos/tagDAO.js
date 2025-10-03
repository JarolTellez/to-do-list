const BaseDatabaseHandler = require("../config/baseDatabaseHandler");
const { TAG_SORT_FIELD } = require("../constants/sortConstants");

class TagDAO extends BaseDatabaseHandler {
  constructor({ tagMapper, dbManager, errorFactory, inputValidator }) {
    super({ dbManager, inputValidator, errorFactory });
    this.tagMapper = tagMapper;
  }

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

async createMultiple(tagDomains = [], externalDbClient = null) {
  return this.dbManager.withTransaction(async (dbClient) => {
    try {
      if (!Array.isArray(tagDomains)) {
        throw this.errorFactory.createValidationError("Tags must be an array");
      }

  
      const validTagDomains = tagDomains.filter(tag => 
        tag && tag.name && typeof tag.name === "string"
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
              description: tagDomain.description
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
        tags: tagDomains.map(t => t.toJSON()) 
      });
    }
  }, externalDbClient);
}

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


async findByIds(tagIds = [], externalDbClient = null) {
  return this.dbManager.forRead(async (dbClient) => {
    try {
      if (!Array.isArray(tagIds)) {
        throw this.errorFactory.createValidationError("tagIds must be an array");
      }
      const validTagIds = tagIds
        .filter(tagId => Number.isInteger(tagId) && tagId > 0)
        .map(tagId => Number(tagId));

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

  async findAllByUserId({
    userId,
    externalDbClient = null,
    limit = null,
    offset = null,
    sortBy = TAG_SORT_FIELD.CREATED_AT,
    sortOrder = "desc",
  } = {}) {
    return this.dbManager.forRead(async (dbClient) => {
      try {
        const userIdNum = this.inputValidator.validateId(userId, "user id");

        const sortOptions = this._buildSortOptions(
          sortBy,
          sortOrder,
          TAG_SORT_FIELD
        );
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
}

module.exports = TagDAO;
