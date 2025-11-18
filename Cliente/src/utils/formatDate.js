/**
 * Formats date for user-friendly display
 * @function formatDateForDisplay
 * @param {string|Date} fecha - Date to format
 * @returns {string} Formatted date string or empty string if invalid
 * @example
 * // Returns "15 dic. 2023, 14:30"
 * formatDateForDisplay('2023-12-15T14:30:00');
 */
export function formatDateForDisplay(fecha) {
  if (!fecha) return "";

  const date = new Date(fecha);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats date for datetime-local input field
 * @function formatDateForDateTimeInput
 * @param {Date} date - Date object to format
 * @returns {string} Formatted string in YYYY-MM-DDTHH:mm format
 * @example
 * // Returns "2023-12-15T14:30"
 * formatDateForDateTimeInput(new Date('2023-12-15T14:30:00'));
 */
export function formatDateForDateTimeInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts Date object to MySQL datetime format
 * @function convertToMySQLDateTime
 * @param {Date} fecha - Date object to convert
 * @returns {string} Formatted string in YYYY-MM-DD HH:mm:ss format
 * @example
 * // Returns "2023-12-15 14:30:00"
 * convertToMySQLDateTime(new Date('2023-12-15T14:30:00'));
 */
export function convertToMySQLDateTime(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  const horas = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  const segundos = String(fecha.getSeconds()).padStart(2, "0");

  return `${anio}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
}
