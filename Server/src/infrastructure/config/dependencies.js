const User = require('../../domain/entities/user');
const Tag = require('../../domain/entities/tag');
const Task = require('../../domain/entities/task');
const Session = require('../../domain/entities/session');
const TaskTag = require('../../domain/entities/taskTag');
const SessionFactory = require('../../domain/factories/sessionFactory');
const TaskDAO = require('../daos/taskDAO');
const TagDAO = require('../daos/tagDAO');
const UserDAO = require('../daos/userDAO');
const TaskTagDAO = require('../daos/taskTagDAO');
const SessionDAO = require('../daos/sessionDAO');
const UserService = require('../../aplication/services/userService');
const TaskService = require('../../aplication/services/taskService');
const TaskTagService = require('../../aplication/services/taskTagService');
const TagService = require('../../aplication/services/tagService');
const AuthService= require('../../aplication/services/authService');
const SessionService = require('../../aplication/services/sessionService');
const TaskFactory = require('../../domain/factories/taskFactory');
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
const UserResponseDTO = require('../../aplication/dtos/response_dto/userResponseDTO');
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

const connectionDB = ConnectionDB.getInstance();
// DAOs con sus dependencias
const taskDAO = new TaskDAO({taskMapper, connectionDB, DatabaseError, ConflictError} );
const taskTagDAO = new TaskTagDAO({taskTagMapper, connectionDB, DatabaseError,  ConflictError});
const tagDAO = new TagDAO({tagMapper, connectionDB, DatabaseError,  ConflictError});
const userDAO = new UserDAO({userMapper, connectionDB, bcrypt, DatabaseError,  ConflictError});
const sessionDAO = new SessionDAO({sessionMapper, connectionDB, DatabaseError, ConflictError});

const jwtAuth = new JwtAuth();

// Servicios
const userService = new UserService({userDAO,connectionDB, bcrypt, ConflictError, ValidationError, NotFoundError, validateRequired: validateRequiredObj});
const tagService = new TagService({tagDAO, connectionDB, NotFoundError, validateRequired: validateRequiredObj});
const taskTagService = new TaskTagService({taskTagDAO, connectionDB, NotFoundError, validateRequired: validateRequiredObj});
const taskService = new TaskService({taskDAO, tagService, taskTagService, connectionDB, NotFoundError, validateRequired: validateRequiredObj});
const sessionService = new SessionService({sessionDAO,jwtAuth, AuthenticationError, NotFoundError, connectionDB, validateRequired: validateRequiredObj});
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