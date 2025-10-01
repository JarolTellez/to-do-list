const SORT_ORDER = Object.freeze({
  ASC: "asc",
  DESC: "desc",
});

const TAG_SORT_FIELD = Object.freeze({
  ID: "id",
  NAME: "name",
  DESCRIPTION: "description",
  CREATED_AT: "createdAt", 
});

const USER_SORT_FIELD = Object.freeze({
  ID: "id",
  USER_NAME: "username",   
  EMAIL: "email",
  CREATED_AT: "createdAt",  
  UPDATED_AT: "updatedAt",  
});

const TASK_SORT_FIELD = Object.freeze({
  ID: "id",
  NAME: "name",
  DESCRIPTION: "description",
  SCHEDULED_DATE: "scheduledDate",  
  IS_COMPLETED: "isCompleted",         
  PRIORITY: "priority",     
  CREATED_AT: "createdAt",          
  LAST_UPDATE_DATE: "lastUpdateDate",
});

const SESSION_SORT_FIELD = Object.freeze({
  ID: "id",
  REFRESH_TOKEN_HASH: "refreshTokenHash", 
  USER_AGENT: "userAgent",                  
  IP: "ip",                          
  EXPIRES_AT: "expiresAt",                     
  CREATED_AT: "createdAt",          
});

const TASK_TAG_SORT_FIELD = Object.freeze({
  ID: "id", 
  CREATED_AT: "createdAt",          
});

const USER_TAG_SORT_FIELD = Object.freeze({
  ID: "id", 
  CREATED_AT: "createdAt",          
});

module.exports = {
  SORT_ORDER,
  TAG_SORT_FIELD,
  USER_SORT_FIELD,
  TASK_SORT_FIELD,
  SESSION_SORT_FIELD,
  TASK_TAG_SORT_FIELD,
  USER_TAG_SORT_FIELD,
};