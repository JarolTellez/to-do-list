// utils/formatFecha.js
export function formatearFechaRender(fecha) {
  return fecha?.toLocaleDateString('es-MX',  {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}) || '';
}
