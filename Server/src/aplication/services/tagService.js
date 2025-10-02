class TagService  {
  constructor({tagDAO, dbManager, errorFactory, validator, paginationHelper}) {
    this.dbManager=dbManager;
    this.tagDAO = tagDAO;
    this.errorFactory=errorFactory;
    this.validator=validator;
    this.paginationHelper=paginationHelper;
  }


  // MODIFICAR LA DAO Y SUS METODO PARA QUE HAYA UNA TABLA INTERMEDIA CON LAS ETIQUETAS Y USUARIOS CON RELACION
  // MUCHOS A MUCHOS
  async createTag(tag, transactionClient = null) {
    return this.dbManager.withTransaction(async (tx) => {
      const tagResult = await this.tagDAO.findByName(
        tag.name,
        tx
      );

      if (tagResult) {
        return tagResult;
      }

      const createdTag = await this.tagDAO.create(
        tag,
        tx
      );
      return createdTag;
    }, transactionClient);
  }

  async getAllTagsByUserId(userId, transactionClient = null) {
    return this.dbManager.withTransaction(async (tx) => {
      const tagsResult = await this.userTagDAO.findAllByUserId(
        userId,
        tx
      );
      return tagsResult;
    }, transactionClient);
  }

  async getTagByName(name, transactionClient = null) {
    return this.dbManager.withTransaction(async (tx) => {
      const tag = await this.tagDAO.findByName(
        name,
        tx
      );
       if (tag) {
        throw this.errorFactory.createNotFoundError("Etiqueta no encontrada", {
          attemptedData: {name},
        });
      }
      return tag;
    }, transactionClient);
  }
}

module.exports = TagService;
