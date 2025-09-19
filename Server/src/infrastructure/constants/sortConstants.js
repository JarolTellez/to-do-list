export const SORT_ORDER = Object.freeze({
  ASC: 'asc',
  DESC: 'desc',
});

export const TAG_SORT_FIELD = Object.freeze({
  ID: 'id',
  NAME: 'name',
  DESCRIPTION: 'description',
  CREATED_AT: 'created_at',
});

export const USER_SORT_FIELD = Object.freeze({
  ID: 'id',
  NAME: 'name',
  EMAIL: 'email',
  CREATED_AT: 'created_at',
  UPDATED_AT:'updated_at'
});

export const TASK_SORT_FIELD = Object.freeze({
  ID: 'id',
  NAME: 'name',
  DESCRIPTION: 'description',
  CREATED_AT: 'created_at',
  LAST_UPDATE_DATE: 'last_update_date'
});

export const SESSION_SORT_FIELD = Object.freeze({
    ID: 'id',
    CREATED_AT:'created_at',
    EXPIRES_AT: 'expires_at'
});

export const TASK_TAG_SORT_FIELD = Object.freeze({
  CREATED_AT: 'created_at',
});

export const USER_TAG_SORT_FIELD = Object.freeze({
  CREATED_AT: 'created_at',
});

export const SORT_FIELD_MAPPINGS = Object.freeze({
  TASK: {
    [TASK_SORT_FIELD.ID]: 't.id',
    [TASK_SORT_FIELD.NAME]: 't.name',
    [TASK_SORT_FIELD.DESCRIPTION]: 't.description',
    [TASK_SORT_FIELD.CREATED_AT]: 't.created_at',
    [TASK_SORT_FIELD.LAST_UPDATE_DATE]: 't.last_update_date'
  },
  TAG: {
    [TAG_SORT_FIELD.ID]: 'tg.id',
    [TAG_SORT_FIELD.NAME]: 'tg.name',
    [TAG_SORT_FIELD.DESCRIPTION]: 'tg.description',
    [TAG_SORT_FIELD.CREATED_AT]: 'tg.created_at'
  },
  USER: {
    [USER_SORT_FIELD.ID]: 'u.id',
    [USER_SORT_FIELD.NAME]: 'u.name',
    [USER_SORT_FIELD.EMAIL]: 'u.email',
    [USER_SORT_FIELD.CREATED_AT]: 'u.created_at',
    [USER_SORT_FIELD.UPDATED_AT]: 'u.updated_at'
  },
  SESSION: {
    [SESSION_SORT_FIELD.ID]: 's.id',
    [SESSION_SORT_FIELD.CREATED_AT]: 's.created_at',
    [SESSION_SORT_FIELD.EXPIRES_AT]: 's.expires_at'
  },
  TASK_TAG: {
    [TASK_TAG_SORT_FIELD.CREATED_AT]: 'tt.created_at'
  },

  USER_TAG: {
    [USER_TAG_SORT_FIELD.CREATED_AT]: 'ut.created_at'
  }
});
