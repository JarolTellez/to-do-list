const BaseDatabaseHandler = require('../config/BaseDatabaseHandler');

class TagDAO extends BaseDatabaseHandler {
   constructor({tagMapper, connectionDB, DatabaseError, ConflictError}) {
    super(connectionDB);
    this.tagMapper = tagMapper;
    this.DatabaseError = DatabaseError;
    this.ConflictError = ConflictError;
  }

   async create(tag, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);

    try {
      const [result] = await connection.execute(
        'INSERT INTO tags (name, user_id) VALUES(?, ?)',
        [tag.name, tag.userId]
      );
      tag.id = result.insertId;
      return tag;
    } catch (error) {
      // Error para duplicados
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
      return tag;
    } catch (error) {
      
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
      
      return result.affectedRows>0;
    } catch (error) {
      // Manejar error de clave foránea
      if (error.code === 'ER_ROW_IS_REFERENCED' || error.errno === 1451) {
        throw new this.ConflictError(
          'No se puede eliminar la etiqueta porque está siendo utilizada',
          { attemptedData:{tagId: id} }
        );
      }
      
      throw new this.DatabaseError(
        'Error al eliminar la etiqueta de la base de datos',
        { attemptedData:{tagId: id}, originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }


   async findAll(externalConn = null) {
   const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.query(
       ` SELECT 
       id AS tag_id,
       name AS tag_name,
       description AS tag_description,
       created_at AS tag_created_at
        FROM tags`);
      return rows;
    } catch (error) {
      throw new this.DatabaseError(
        'Error al consultar todas las etiquetas',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

   async findByName(name, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.query(
        `SELECT 
         id AS tag_id,
          name AS tag_name,
          description AS tag_description,
          created_at AS tag_created_at
          FROM tags WHERE name = ?`,
        [name]
      );
      
      return rows[0];
    } catch (error) {
      throw new this.DatabaseError(
        'Error al consultar la etiqueta en la base de datos',
        { attemptedData:{name: name, userId:userId},originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }

  //busca Tag por Id
   async findById(id, externalConn = null) {
     const {connection, isExternal} = await this.getConnection(externalConn);
    try {
      const [rows] = await connection.execute(
        `SELECT 
         id AS tag_id,
         name AS tag_name,
         description AS tag_description,
         created_at AS tag_created_at
         FROM tags WHERE id = ?`,
        [id]
      );
    
      
      return rows[0];
    } catch (error) {
      
      throw new this.DatabaseError(
        'No se pudo consultar la etiqueta en la base de datos',
        { originalError: error.message, code: error.code }
      );
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }


  //Metodos compuestos
  //Busca tags asociados a un usuario (join con user_tag)
   async findAllByUserId(userId, externalConn=null){
    const {connection, isExternal} = await this.getConnection(externalConn);

    try {
        const [rows]= await connection.execute(`
          SELECT 
          t.id AS tag_id,
	      	t.name AS tag_name,
          t.description AS tag_description,
	      	t.created_at AS tag_created_at
          FROM tags t 
          INNER JOIN user_tag ut ON t.id=ut.tag_id 
          WHERE ut.user_id = ?`,[userId]);
        const mappedTags = rows.map(tag=>this.tagMapper.dbToDomain(tag));

        return mappedTags;
    } catch (error) {
        throw new this.DatabaseError("Error al consultar las userTag en la base de datos",{
            attemptedData:{userId,originalError: error.message, code: error.code}
        })
        
    }finally{
        await this.releaseConnection(connection, isExternal);
    }
  }

}

module.exports = TagDAO;