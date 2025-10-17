const {
  SORT_ORDER,
  TAG_SORT_FIELD,
} = require("../../infrastructure/constants/sortConstants");
class TagService {
  constructor({
    tagDAO,
    tagMapper,
    dbManager,
    errorFactory,
    validator,
    sortValidator,
    paginationHelper,
    paginationConfig,
    errorMapper,
  }) {
    this.dbManager = dbManager;
    this.tagDAO = tagDAO;
    this.tagMapper = tagMapper;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.sortValidator = sortValidator;
    this.paginationHelper = paginationHelper;
    this.paginationConfig = paginationConfig;
    this.errorMapper = errorMapper;
  }

  async createTag(tag, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      return this.dbManager.withTransaction(async (dbClient) => {
        const tagResult = await this.tagDAO.findByName(tag.name, dbClient);

        if (tagResult) {
          return tagResult;
        }

        const createdTag = await this.tagDAO.create(tag, dbClient);

        if (!createdTag) {
          throw this.errorFactory.createDatabaseError(
            "Error al crear la etiqueta en la base de datos",
            {
              tagName: tag.name,
              operation: "createTag",
            }
          );
        }
        return createdTag;
      }, externalDbClient);
    });
  }

  async createMultipleTags(tagsDomain, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      return this.dbManager.withTransaction(async (dbClient) => {
        if (!tagsDomain || tagsDomain.length === 0) {
          return [];
        }

        // Extracts only names to search
        const tagNames = tagsDomain.map((tag) => tag.name);

        // Search existing tags by name
        const existingTags = await this.tagDAO.findByNames(tagNames, dbClient);
        const existingTagNames = existingTags.map((t) => t.name);

        // Identify new tags
        const newTagDomains = tagsDomain.filter(
          (tag) => !existingTagNames.includes(tag.name)
        );

        let allTags = [...existingTags];

        // Crate new tags
        if (newTagDomains.length > 0) {
          const createdTags = await this.tagDAO.createMultiple(
            newTagDomains,
            dbClient
          );

          if (!createdTags || createdTags.length !== newTagDomains.length) {
            throw this.errorFactory.createDatabaseError(
              "Error al crear algunas etiquetas en la base de datos",
              {
                attemptedTags: newTagDomains.map((t) => t.name),
                createdCount: createdTags ? createdTags.length : 0,
                expectedCount: newTagDomains.length,
                operation: "createMultipleTags",
              }
            );
          }
          allTags = [...allTags, ...createdTags];
        }

        return allTags;
      }, externalDbClient);
    });
  }

  async processMixedTags(mixedTags, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      return this.dbManager.withTransaction(async (dbClient) => {
        if (!mixedTags || mixedTags.length === 0) {
          return [];
        }
        const tagDomains = mixedTags;
        // create new tags if exists
        const tags = await this.createMultipleTags(tagDomains, dbClient);
        const tagIds = tags.map((tag) => tag.id);

        // new set deletes duplicate
        return [...new Set(tagIds)];
      }, externalDbClient);
    });
  }

  async getTagsByIds(tagIds, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      return this.dbManager.forRead(async (dbClient) => {
        if (!tagIds || tagIds.length === 0) {
          return [];
        }

        const tags = await this.tagDAO.findByIds(tagIds, dbClient);

        if (!tags || tags.length === 0) {
          throw this.errorFactory.createNotFoundError(
            "No se encontraron etiquetas con los IDs proporcionados",
            {
              tagIds: tagIds,
              operation: "getTagsByIds",
            }
          );
        }
        return tags;
      }, externalDbClient);
    });
  }

  async getAllTagsByUserId(userId, options = {}, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      return this.dbManager.forRead(async (dbClient) => {
        const {
          page = this.paginationConfig.DEFAULT_PAGE,
          limit = this.paginationConfig.DEFAULT_LIMIT,
          sortBy,
          sortOrder,
        } = options;

        const validatedSort = this.sortValidator.validateAndNormalizeSortParams(
          "TAG",
          { sortBy, sortOrder }
        );
        const pagination = this.paginationHelper.calculatePagination(
          page,
          limit,
          this.paginationConfig.ENTITY_LIMITS.TAGS,
          this.paginationConfig.DEFAULT_PAGE,
          this.paginationConfig.DEFAULT_LIMIT
        );

        const tags = await this.tagDAO.findAllByUserId(
          {
            userId,
            limit: pagination.limit,
            offset: pagination.offset,
            sortBy: validatedSort.sortBy,
            sortOrder: validatedSort.sortOrder,
          },
          dbClient
        );

        const total = await this.tagDAO.countByUserId(userId, dbClient);
        const totalPages = this.paginationHelper.calculateTotalPages(
          total,
          pagination.limit
        );

        return this.paginationHelper.buildPaginationResponse(
          tags,
          pagination,
          total,
          totalPages,
          "tags"
        );
      }, externalDbClient);
    });
  }

  async getTagByName(name, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["name"], { name });

      return this.dbManager.forRead(async (dbClient) => {
        const tag = await this.tagDAO.findByName(name, dbClient);

        if (!tag) {
          throw this.errorFactory.createNotFoundError(
            "Etiqueta no encontrada",
            {
              tagName: name,
              operation: "getTagByName",
            }
          );
        }

        return tag;
      }, externalDbClient);
    });
  }

  async getTagById(tagId, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["tagId"], { tagId });

      return this.dbManager.forRead(async (dbClient) => {
        const tag = await this.tagDAO.findById(tagId, dbClient);

        if (!tag) {
          throw this.errorFactory.createNotFoundError(
            "Etiqueta no encontrada",
            {
              tagId: tagId,
              operation: "getTagById",
            }
          );
        }

        return tag;
      }, externalDbClient);
    });
  }

  async getByNames(tagNames, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      return this.dbManager.forRead(async (dbClient) => {
        if (!tagNames || tagNames.length === 0) {
          return [];
        }

        const tags = await this.tagDAO.findByNames(tagNames, dbClient);

        return tags;
      }, externalDbClient);
    });
  }

  async validateTagsExist(tagIds, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      if (!tagIds || tagIds.length === 0) {
        return true;
      }

      const tags = await this.tagDAO.findByIds(tagIds, dbClient);
      return tags.length === tagIds.length;
    }, externalDbClient);
  }
}

module.exports = TagService;
