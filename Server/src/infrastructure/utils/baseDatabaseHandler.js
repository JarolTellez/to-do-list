class BaseDatabaseHandler {
  constructor({connectionDB}) {
    this.connectionDB = connectionDB;
  }

  async getConnection(externalConn) {
    if (externalConn) return { connection: externalConn, isExternal: true };
    const connection = await this.connectionDB.connect();
    return { connection, isExternal: false };
  }

  async releaseConnection(connection, isExternal) {
  if (!isExternal && connection && typeof connection.release === 'function') {
    try {
      connection.release();
    } catch (releaseError) {
      console.error("Error releasing database connection:", releaseError.message);
      
      throw new this.DatabaseError(
        "Error releasing database connection",
        {
          originalError: releaseError.message,
          code: releaseError.code,
          stack: releaseError.stack
        }
      );
    }
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