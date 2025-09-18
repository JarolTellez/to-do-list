class BaseDatabaseHandler {
  constructor(connectionDB) {
    this.connectionDB = connectionDB;
  }

  async getConnection(externalConn) {
    if (externalConn) return { connection: externalConn, isExternal: true };
    const connection = await this.connectionDB.connect();
    return { connection, isExternal: false };
  }

  async releaseConnection(connection, isExternal) {
    if (!isExternal && connection && typeof connection.release === "function") {
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

  async _executeQuery({
    connection,
    baseQuery,
    params = [],
    sortBy = null,
    sortOrder = SORT_ORDER.DESC,
    sortConstants = null,
    entityType = "ENTITY",
    entityName = "entity",
    limit = null,
    offset = null,
    mapper = null,
    mapperType = "SINGLE_ROW",
  }) {
    let query = baseQuery;
    const queryParams = [...params];

    if (sortBy && sortConstants) {
      const { safeField } = this.inputValidator.validateSortField(
        sortBy,
        sortConstants,
        entityType,
        `${entityName} sort field`
      );
      const { safeOrder } = this.inputValidator.validateSortOrder(
        sortOrder,
        SORT_ORDER
      );

      query += ` ORDER BY ${safeField} ${safeOrder}`;
    }

    if (limit !== null) {
      query += " LIMIT ?";
      queryParams.push(limit);
    }
    if (offset !== null) {
      query += " OFFSET ?";
      queryParams.push(offset);
    }

    const [rows] = await connection.query(query, queryParams);

    if (mapper && typeof mapper === "function") {
      if (mapperType === "ALL_ROWS") {
        // toda sa la vez
        return mapper(rows);
      } else {
        // una row a la vez
        return Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => mapper(row))
          : [];
      }
    }

    return rows;
  }
}

module.exports = BaseDatabaseHandler;
