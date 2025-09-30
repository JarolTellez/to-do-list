const TransactionsHandler = require('../../infrastructure/config/transactionsHandler');

class TagService extends TransactionsHandler {
  constructor({tagDAO, connectionDB, errorFactory, validator}) {
    super(connectionDB);
    this.tagDAO = tagDAO;
    this.errorFactory=errorFactory;
    this.validator=validator;
  }


  // MODIFICAR LA DAO Y SUS METODO PARA QUE HAYA UNA TABLA INTERMEDIA CON LAS ETIQUETAS Y USUARIOS CON RELACION
  // MUCHOS A MUCHOS
  async createTag(tag, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const tagResult = await this.tagDAO.findByName(
        tag.name,
        connection
      );

      if (tagResult) {
        return tagResult;
      }

      const createdTag = await this.tagDAO.create(
        tag,
        connection
      );
      return createdTag;
    }, externalConn);
  }

  async getAllTagsByUserId(userId, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const tagsResult = await this.userTagDAO.findAllByUserId(
        userId,
        connection
      );
      return tagsResult;
    }, externalConn);
  }

  async getTagByName(name, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const tag = await this.tagDAO.findByName(
        name,
        connection
      );
       if (tag) {
        throw this.errorFactory.createNotFoundError("Etiqueta no encontrada", {
          attemptedData: {name},
        });
      }
      return tag;
    }, externalConn);
  }
}

module.exports = TagService;
