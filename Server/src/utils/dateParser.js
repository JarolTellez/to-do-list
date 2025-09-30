class DateParser {
  
  /**
   * Converts a date from frontend format to MySQL datetime format
   * @param {string|Date} frontendDate - Date from frontend (ISO string, Date object, or any valid date format)
   * @returns {string|null} Date in MySQL datetime format (YYYY-MM-DD HH:mm:ss) or null if invalid
   * @example
   * toMySQLDateTime('2024-01-15T14:30:00.000Z') // Returns '2024-01-15 14:30:00'
   * toMySQLDateTime(new Date()) // Returns current date in MySQL format
   */
  toMySQLDateTime(frontendDate) {
    if (!frontendDate) return null;
    
    const date = new Date(frontendDate);
    if (isNaN(date.getTime())) return null;
    
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * Converts MySQL datetime string to JavaScript Date object
   * @param {string} mysqlDateTime - Date in MySQL format (YYYY-MM-DD HH:mm:ss)
   * @returns {Date|null} JavaScript Date object or null if invalid
   * @example
   * fromMySQLDateTime('2024-01-15 14:30:00') // Returns Date object
   */
  fromMySQLDateTime(mysqlDateTime) {
     if (mysqlDateTime instanceof Date) {
      return isNaN(mysqlDateTime.getTime()) ? null : mysqlDateTime;
    }
    if (!mysqlDateTime) {
      return null;
    }
    if (typeof mysqlDateTime === 'string') {
      let isoString;
      
      if (mysqlDateTime.includes(' ')) {
        isoString = mysqlDateTime.replace(' ', 'T');
      } else if (mysqlDateTime.includes('T')) {
        isoString = mysqlDateTime;
      } else {
        isoString = mysqlDateTime;
      }
      const date = new Date(isoString);
      return isNaN(date.getTime()) ? null : date;
    }
    try {
      const date = new Date(mysqlDateTime);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validates if a string is in MySQL datetime format
   * @param {string} dateString - String to validate
   * @returns {boolean} True if valid MySQL datetime format
   * @example
   * isValidMySQLFormat('2024-01-15 14:30:00') // Returns true
   */
  isValidMySQLFormat(dateString) {
    if (typeof dateString !== 'string') return false;
    
    const mysqlRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    return mysqlRegex.test(dateString);
  }
}

module.exports = DateParser;