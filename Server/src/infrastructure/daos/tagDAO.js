const BaseDatabaseHandler = require('../config/BaseDatabaseHandler');

class TagDAO extends BaseDatabaseHandler {
   constructor({tagMapper, connectionDB, DatabaseError, NotFoundError, ConflictError}) {
    super(connectionDB);
    this.tagMapper = tagMapper;
    this.DatabaseError = DatabaseError;
    this.NotFoundError = NotFoundError;
    this.ConflictError = ConflictError;
  }

   async create(tag, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        'INSERT INTO tags (name, user_id) VALUES(?, ?)',
        [tag.name, tag.userId]
      );
// AGREGAR MAPEO
      tag.id = result.insertId;
      return tag;
    } catch (error) {
      // Error específico para duplicados
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError(
          'Ya existe una etiqueta con ese nombre para este usuario',
          { name: tag.name, userId: tag.userId }
        );
      }
      
      throw new this.DatabaseError(
        'Error al crear la etiqueta en la base de datos',
        { originalError: error.message, code: error.code, attemptedData:{name: tag.name, userId: tag.userId} }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async update(tag, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        'UPDATE tags SET name = ? WHERE id = ?', 
        [tag.name, tag.id]
      );
      
      // Verificar si se actualizó algún registro
      if (result.affectedRows === 0) {
        throw new this.NotFoundError('La etiqueta no existe', {tagId: tag.tagId});
      }
      
      return tag;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      // Error de duplicado al actualizar
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError('Ya existe una etiqueta con ese nombre',{attemptedData:{tagName: tag.name}});
      }
      
      throw new this.DatabaseError(
        'Error al actualizar la etiqueta en la base de datos',
        { originalError: error.message, code: error.code, attemptedData:{ tagId: tag.id, tagName: tag.name} }
      );
    } finally {
     await this.releaseConnection(connection, isExternal);
    }
  }

   async delete(id, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        'DELETE FROM tags WHERE id = ?', 
        [id]
      );
      
      // Verificar si se eliminó algún registro
      if (result.affectedRows === 0) {
        throw new this.NotFoundError('La etiqueta no existe en la base de datos',{ attemptedData:{tagId:id}});
      }
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      // Manejar error de clave foránea
      if (error.code === 'ER_ROW_IS_REFERENCED' || error.errno === 1451) {
        throw new this.ConflictError(
          'No se puede eliminar la etiqueta porque está siendo utilizada',
          { id }
        );
      }
      
      throw new this.DatabaseError(
        'No se pudo eliminar la etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async findAll(externalConn = null) {
   const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.query('SELECT * FROM tags');
      return rows;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar todas las tags',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async findByNameAndUserId(name, userId, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.query(
        'SELECT * FROM tags WHERE name = ? AND user_id = ?',
        [name, userId]
      );
      
      return rows[0];
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar la tag',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async findById(id, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM tags WHERE id = ?',
        [id]
      );
      
      if (!rows[0]) {
        throw new this.NotFoundError('Etiqueta no encontrada');
      }
      
      return rows[0];
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      throw new this.DatabaseError(
        'No se pudo consultar la etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async findAllByUserId(idUsuario, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [tags] = await connection.query(
        'SELECT * FROM tags WHERE user_id= ?',
        [idUsuario]
      );
      
      const tareasMapeadas = tags.map(tag => this.tagMapper.dbToDomain(tag));
      return tareasMapeadas;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar las tags del usuario',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }


// DESAROLLAR DESPUES, NO ES PRIORIDAD
  findByName(name){

  }
}

module.exports = TagDAO;