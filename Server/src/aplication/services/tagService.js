const {
  SORT_ORDER,
  TAG_SORT_FIELD,
} = require("../../infrastructure/constants/sortConstants");
/**
 * Tag management service for handling tag operations
 * @class TagService
 * @description Manages tag creation, retrieval, and validation operations
 */
class TagService {
  /**
   * Creates a new TagService instance
   * @constructor
   * @param {Object} dependencies - Service dependencies
   * @param {TagDAO} dependencies.tagDAO - Tag data access object
   * @param {Object} dependencies.tagMapper - Tag mapper for data transformation
   * @param {Object} dependencies.dbManager - Database manager for transactions
   * @param {ErrorFactory} dependencies.errorFactory - Error factory instance
   * @param {Validator} dependencies.validator - Validation utility
   * @param {SortValidator} dependencies.sortValidator - Sort parameter validator
   * @param {PaginationHelper} dependencies.paginationHelper - Pagination utility
   * @param {Object} dependencies.paginationConfig - Pagination configuration
   * @param {ErrorMapper} dependencies.errorMapper - Error mapping utility
   */
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
  /**
   * Creates a new tag
   * @param {Object} tag - Tag domain object
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Created tag object
   */
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

  /**
   * Creates multiple tags in batch
   * @param {Array} tagsDomain - Array of tag domain objects
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Array>} Array of created tag objects
   */
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

  /**
   * Processes mixed tags (existing and new) and returns final tag IDs
   * @param {Array} mixedTags - Array of mixed tag objects
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Array>} Array of processed tag IDs
   */
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

  /**
   * Retrieves tags by their IDs
   * @param {Array} tagIds - Array of tag identifiers
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Array>} Array of tag objects
   */
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

  /**
   * Retrieves all tags for a user with pagination
   * @param {string} userId - User identifier
   * @param {Object} [options={}] - Pagination and sorting options
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Paginated list of user tags
   */
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

        return this.paginationHelper.buildPaginationResponse({
          data: tags,
          paginationInfo: pagination,
          total: total,
          totalPages: totalPages,
          itemsKey: "tags",
        });
      }, externalDbClient);
    });
  }

  /**
   * Retrieves tag by name
   * @param {string} name - Tag name
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Tag object
   */
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

  /**
   * Retrieves tag by ID
   * @param {string} tagId - Tag identifier
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Object>} Tag object
   */
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

  /**
   * Retrieves tags by their names
   * @param {Array} tagNames - Array of tag names
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<Array>} Array of tag objects
   */
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

  /**
   * Validates that all tag IDs exist in database
   * @param {Array} tagIds - Array of tag identifiers to validate
   * @param {Object} [externalDbClient=null] - External database client for transactions
   * @returns {Promise<boolean>} True if all tags exist
   */
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
