const BaseDatabaseHandler = require("../config/BaseDatabaseHandler");

class UserTagDAO extends BaseDatabaseHandler {
  constructor({ tagMapper, connectionDB, DatabaseError, ConflicError }) {
    super(connectionDB);
    this.tagMapper = tagMapper;
    this.DatabaseError = DatabaseError;
    this.ConflicError = ConflicError;
  }

  async create(userId, tagId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        `INSERT INTO user_tag (user_id, tag_id) VALUES(?,?)`,
        [userId, tagId]
      );

      const id = result.insertedId;
      return id;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
        throw new this.ConflictError(
          "Este usuario ya tiene asignado esta etiqueta",
          { attemptedData: { userId, tagId } }
        );
      }

      if (error.code === "ER_NO_REFERENCED_ROW" || error.errno === 1452) {
        throw new this.ConflictError(
          "El usuario o etiqueta referenciada no existe",
          { attemptedData: { userId, tagId } }
        );
      }

      throw new this.DatabaseError(
        "Error al crear la relacion userTag en la base de datos",
        {
          attemptedData: { userId, tagId },
          originalError: error.message,
          code: error.code,
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  // DELETE
  async delete(id, userId, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        "DELETE FROM user_tag WHERE id=? AND user_id=?",
        [id, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new this.DatabaseError(
        `Erro al eliminar la relacion userTag de la base de datos`,
        {
          attemptedData: {
            userTagId: id,
            userId,
            originalError: error.message,
            code: error.code,
          },
        }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  async deleteByUserIdAndTagId(userId, tagId) {}

  async deleteAllByUserId(userId, externalConn = null) {}

  async deleteAllByTagId(tagId, externalConn = null) {}
  async findById(id) {}
  async findByUserIdAndTagId(userId, tagId) {}
  async findByUserId(userId) {}
  async findByTagId(tagId) {}
}
module.exports = UserTagDAO;
