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
        'INSERT INTO etiquetas (name, id_usuario) VALUES(?, ?)',
        [tag.name, tag.userId]
      );

      tag.idE = result.insertId;
      return tag;
    } catch (error) {
      // Error específico para duplicados
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError(
          'Ya existe una etiqueta con ese name para este usuario',
          { name: tag.name, idUsuario: tag.idUsuario }
        );
      }
      
      throw new this.DatabaseError(
        'No se pudo guardar la tag',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async update(tag, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [result] = await connection.execute(
        'UPDATE etiquetas SET name = ? WHERE id_etiqueta = ?', 
        [tag.name, tag.id]
      );
      
      // Verificar si se actualizó algún registro
      if (result.affectedRows === 0) {
        throw new this.NotFoundError('La etiqueta no existe');
      }
      
      return tag;
    } catch (error) {
      if (error instanceof this.NotFoundError) throw error;
      
      // Error de duplicado al actualizar
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new this.ConflictError('Ya existe una tag con ese nombre');
      }
      
      throw new this.DatabaseError(
        'No se pudo actualizar la etiqueta',
        { originalError: error.message, code: error.code }
      );
    } finally {
     await this.releaseConnection(connection, isExternal);
    }
  }

   async delete(id, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        'DELETE FROM etiquetas WHERE id_etiqueta = ?', 
        [id]
      );
      
      // Verificar si se eliminó algún registro
      if (result.affectedRows === 0) {
        throw new this.NotFoundError('La etiqueta no existe');
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
      const [rows] = await connection.query('SELECT * FROM etiquetas');
      return rows;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar todas las etiquetas',
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
        'SELECT * FROM etiquetas WHERE name = ? AND id_usuario = ?',
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
        'SELECT * FROM etiquetas WHERE id_etiqueta = ?',
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
      const [etiquetas] = await connection.query(
        'SELECT * FROM etiquetas WHERE id_usuario = ?',
        [idUsuario]
      );
      
      const tareasMapeadas = etiquetas.map(tag => this.tagMapper.bdToDominio(tag));
      return tareasMapeadas;
    } catch (error) {
      throw new this.DatabaseError(
        'No se pudo consultar las etiquetas del usuario',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }
}

module.exports = TagDAO;