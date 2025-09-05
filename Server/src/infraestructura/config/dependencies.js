const User = require('../../dominio/entidades/user');
const Tag = require('../../dominio/entidades/tag');
const Task = require('../../dominio/entidades/task');
const Session = require('../../dominio/entidades/session');
const TaskTag = require('../../dominio/entidades/taskTag');
const SessionFactory = require('../../dominio/fabricas/sessionFactory');
const TaskDAO = require('../../infraestructura/daos/taskDAO');
const TagDAO = require('../../infraestructura/daos/tagDAO');
const UserDAO = require('../../infraestructura/daos/userDAO');
const TaskTagDAO = require('../../infraestructura/daos/taskTagDAO');
const SessionDAO = require('../../infraestructura/daos/SessionDAO');
const UserService = require('../../aplicacion/servicios/userService');
const TaskService = require('../../aplicacion/servicios/taskService');
const TaskTagService = require('../../aplicacion/servicios/taskTagService');
const TagService = require('../../aplicacion/servicios/tagService');
const AuthService= require('../../aplicacion/servicios/authService');
const SessionService = require('../../aplicacion/servicios/sessionService');
const TaskFactory = require('../../dominio/fabricas/taskFactory');
const TaskMapper = require('../mappers/taskMapper');
const TaskTagMapper = require('../mappers/taskTagMapper');
const TagMapper = require('../mappers/tagMapper');
const UserMapper = require('../mappers/userMapper');
const SessionMapper = require('../mappers/sessionMapper');
const TaskController = require('../../api/controladores/taskController');
const TagController = require('../../api/controladores/tagController');
const AuthController = require('../../api/controladores/authController');
const ConnectionDB = require('./connectionDB');
const JwtAuth = require('./jwtAuth');
const UserResponseDTO = require('../../aplicacion/dtos/response_dto/userResponseDTO');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const validateRequired = require('../../utils/validators')

const {NotFoundError, ValidationError, DatabaseError, AuthenticationError, ConflictError} = require('../../utils/appErrors');


//validator
const validateRequiredObj = validateRequired(ValidationError);

// Mappers y Factories
const taskFactory = new TaskFactory(Task);
const sessionFactory = new SessionFactory(Session);
const tagMapper = new TagMapper(Tag);
const userMapper = new UserMapper(User, UserResponseDTO);
const taskMapper = new TaskMapper(taskFactory, tagMapper);
const taskTagMapper = new TaskTagMapper(TaskTag);
const sessionMapper = new SessionMapper(Session);

const connectionDB = ConnectionDB.getInstancia();
// DAOs con sus dependencias
const taskDAO = new TaskDAO({taskMapper, connectionDB, DatabaseError, NotFoundError, ConflictError} );
const taskTagDAO = new TaskTagDAO({taskTagMapper, connectionDB, DatabaseError, NotFoundError, ConflictError});
const tagDAO = new TagDAO({tagMapper, connectionDB, DatabaseError, NotFoundError, ConflictError});
const userDAO = new UserDAO({userMapper, connectionDB, bcrypt, DatabaseError, NotFoundError, ConflictError});
const sessionDAO = new SessionDAO({sessionMapper, connectionDB, DatabaseError, NotFoundError, ConflictError});

const jwtAuth = new JwtAuth();

// Servicios
const userService = new UserService({userDAO,connectionDB, bcrypt, ConflictError, ValidationError, validateRequired: validateRequiredObj});
const tagService = new TagService({tagDAO, connectionDB, validateRequired: validateRequiredObj});
const taskTagService = new TaskTagService({taskTagDAO, connectionDB, validateRequired: validateRequiredObj});
const taskService = new TaskService({taskDAO, tagService, taskTagService, connectionDB, validateRequired: validateRequiredObj});
const sessionService = new SessionService({sessionDAO,jwtAuth, AuthenticationError, connectionDB, validateRequired: validateRequiredObj});
const authService = new AuthService({User, sessionFactory, userService, sessionService, connectionDB, userDAO, jwtAuth, bcrypt, crypto, NotFoundError, ValidationError, ConflictError,  AuthenticationError, validateRequired: validateRequiredObj});

// Controladores
const taskController = new TaskController({
  taskService,
  taskMapper
});

const tagController = new TagController({
  tagService,
  tagMapper
});

const authController = new AuthController({
  authService,
  userMapper,
  AuthenticationError
});

module.exports = {
  taskController,
  tagController,
  authController,
  taskService,
  tagService,
  authService,
  taskDAO,
  tagDAO,
  userDAO,
  taskMapper,
  tagMapper,
  userMapper
};