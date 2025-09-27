const {SORT_ORDER} = require("../constants/sortConstants");

class BaseDatabaseHandler {
  constructor(connectionDB, inputValidator, errorFactory) {
    this.connectionDB = connectionDB;
    this.inputValidator = inputValidator; 
    this.errorFactory = errorFactory;
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
        sortBy, sortConstants, entityType, `${entityName} sort field`
      );
      const { safeOrder } = this.inputValidator.validateSortOrder(sortOrder, SORT_ORDER);
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

    let result = rows;
    if (mapper && typeof mapper === "function") {
      if (mapperType === "ALL_ROWS") {
        result = mapper(rows);
      } else {
        result = Array.isArray(rows) && rows.length > 0
          ? rows.map((row) => mapper(row))
          : [];
      }
    }
    return result;
  }
}

module.exports = BaseDatabaseHandler;