class BaseDatabaseHandler {
  constructor({conexionBD}) {
    this.conexionBD = conexionBD;
  }

  async getConnection(externalConn) {
    if (externalConn) return { connection: externalConn, isExternal: true };
    const connection = await this.conexionBD.conectar();
    return { connection, isExternal: false };
  }

  async releaseConnection(connection, isExternal) {
    if (!isExternal && connection && typeof connection.release === 'function') {
      connection.release();
    }
  }

  // Para centralizar el manejo de transacciones (uso en DAO y servicios)
  async withTransaction(callback, externalConn = null) {
    const { connection, isExternal } = await this.getConnection(externalConn);
    const shouldCommit = !isExternal;
    
    try {
      if (shouldCommit) {
        await connection.beginTransaction();
      }
      
      const result = await callback(connection);
      
      if (shouldCommit) {
        await connection.commit();
      }
      
      return result;
      
    } catch (error) {
      if (shouldCommit) {
        await connection.rollback();
      }
      throw error;
    } finally {
      await this.releaseConnection(connection, isExternal);
    }
  }
}



module.exports = BaseDatabaseHandler;