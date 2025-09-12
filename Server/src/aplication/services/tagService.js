const BaseDatabaseHandler = require('../../infrastructure/config/BaseDatabaseHandler');

class TagService extends BaseDatabaseHandler {
  constructor({tagDAO, connectionDB, NotFoundError, validateRequired}) {
    super(connectionDB);
    this.tagDAO = tagDAO;
    this.NotFoundError = NotFoundError;
    this.validateRequired = validateRequired;
  }


  // MODIFICAR LA DAO Y SUS METODO PARA QUE HAYA UNA TABLA INTERMEDIA CON LAS ETIQUETAS Y USUARIOS CON RELACION
  // MUCHOS A MUCHOS
  async createTag(tag, externalConn = null) {
    return this.withTransaction(async (connection) => {
      const tagResult = await this.tagDAO.findByNameAndUserId(
        tag.name,
        tag.userId,
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
        throw new this.NotFoundError("Etiqueta no encontrada", {
          attemptedData: {name},
        });
      }
      return tag;
    }, externalConn);
  }
}

module.exports = TagService;
