class TagService {
  constructor({
    tagDAO,
    dbManager,
    errorFactory,
    validator,
    paginationHelper,
  }) {
    this.dbManager = dbManager;
    this.tagDAO = tagDAO;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.paginationHelper = paginationHelper;
  }

  async createTag(tag, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      const tagResult = await this.tagDAO.findByName(tag.name, dbClient);

      if (tagResult) {
        return tagResult;
      }

      const createdTag = await this.tagDAO.create(tag, dbClient);
      return createdTag;
    }, externalDbClient);
  }

  async getAllTagsByUserId(userId, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      const tagsResult = await this.tagDAO.findAllByUserId(
        userId,
        dbClient
      );
      return tagsResult;
    }, externalDbClient);
  }

  async getTagByName(name, externalDbClient = null) {
    this.validator.validateRequired(["name"], { name });

    return this.dbManager.forRead(async (dbClient) => {
      const tag = await this.tagDAO.findByName(name, dbClient);

      if (!tag) {
        throw this.errorFactory.createNotFoundError("Etiqueta no encontrada", {
          attemptedData: { name },
        });
      }

      return tag;
    }, externalDbClient);
  }

  async getTagById(tagId, externalDbClient = null) {
    this.validator.validateRequired(["tagId"], { tagId });

    return this.dbManager.forRead(async (dbClient) => {
      const tag = await this.tagDAO.findById(tagId, dbClient);

      if (!tag) {
        throw this.errorFactory.createNotFoundError("Etiqueta no encontrada", {
          attemptedData: { tagId },
        });
      }

      return tag;
    }, externalDbClient);
  }
}

module.exports = TagService;
