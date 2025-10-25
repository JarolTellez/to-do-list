export const TASK_PRIORITIES = {
  1: { label: 'Muy Baja', color: '#28a745' },
  2: { label: 'Baja', color: '#20c997' },
  3: { label: 'Media', color: '#ffc107' },
  4: { label: 'Alta', color: '#fd7e14' },
  5: { label: 'Muy Alta', color: '#dc3545' }
};

export const TASK_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  OVERDUE: 'overdue'
};

export const DATE_FILTERS = {
  TODAY: 'today',
  UPCOMING: 'upcoming'
};

export const PRIORITY_FILTERS = {
  HIGHEST: 'highest',
  LOWEST: 'lowest'
};

export const TASK_VALIDATION = {
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 255
};