// Domain
const User = require('../../domain/entities/user');
const Tag = require('../../domain/entities/tag');
const Task = require('../../domain/entities/task');
const Session = require('../../domain/entities/session');
const TaskTag = require('../../domain/entities/taskTag');
const UserTag = require('../../domain/entities/userTag');


//RequestDTO
const {CreateUserRequestDTO,UpdateUserRequestDTO,LoginRequestDTO} = require('../../aplication/dtos/request_dto/userRequestDTOs');
const {CreateTagRequestDTO, UpdateTagRequestDTO}=require('../../aplication/dtos/request_dto/tagRequestDTOs');
const {CreateTaskRequestDTO,UpdateTaskRequestDTO,CompleteTaskRequestDTO}=require('../../aplication/dtos/request_dto/taskRequestDTOs');
const { CreateSessionRequestDTO, RefreshSessionRequestDTO} = require('../../aplication/dtos/request_dto/sessionRequestDTOs');
const  TaskTagRequestDTO =  require('../../aplication/dtos/request_dto/taskTagRequestDTOs');
const UserTagRequestDTO = require('../../aplication/dtos/request_dto/userTagRequestDAOs');

// ResponseDTO
const {UserResponseDTO, AuthResponseDTO} = require('../../aplication/dtos/response_dto/userResponseDTOs');
const TagResponseDTO= require('../../aplication/dtos/response_dto/tagResponseDTOs');
const {TaskResponseDTO, TasksSummaryResponseDTO}= require('../../aplication/dtos/response_dto/taskResponseDTOs');
const SessionResponseDTO = require('../../aplication/dtos/response_dto/sessionResponseDTOs');
const TaskTagResponseDTO = require('../../aplication/dtos/response_dto/taskTagResponseDTOs');
const UserTagResponseDTO = require ('../../aplication/dtos/response_dto/userTagResponseDTOs');

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

// Mapper
const TaskMapper = require('../mappers/taskMapper');
const UserTagMapper =require('../mappers/userTagMapper');
const TaskTagMapper = require('../mappers/taskTagMapper');
const TagMapper = require('../mappers/tagMapper');
const UserMapper = require('../mappers/userMapper');
const SessionMapper = require('../mappers/sessionMapper');


const TaskController = require('../../api/controladores/taskController');
const TagController = require('../../api/controladores/tagController');
const AuthController = require('../../api/controladores/authController');
const ConnectionDB = require('./connectionDB');

//Infraestructura
const  { AppError,
  NotFoundError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  ConflictError,
  RateLimitError,
  ForbiddenError,
  ServiceUnavailableError} = require('../../infrastructure/utils/errors/appErrors');
  const ErrorCodes  = require('../../infrastructure/utils/errors/errorCodes');
const ErrorFactory = require('../../infrastructure/utils/errors/errorFactory');
const DateParser = require('../../utils/dateParser');
const InputValidator = require('../utils/validation/inputValidator');
// No inyectar
const JwtAuth = require('./jwtAuth');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


const errorFactory = new ErrorFactory(NotFoundError,ValidationError,DatabaseError,AuthenticationError,ConflictError,RateLimitError,ForbiddenError,ServiceUnavailableError,AppError,ErrorCodes);
const dateParser = new DateParser();
const connectionDB = ConnectionDB.getInstance();
//validator
const Validator = require('../../utils/validators')
const validator = new Validator(errorFactory);
const inputValidator = new InputValidator(errorFactory);

// Mappers y Factories

const tagMapper = new TagMapper(Tag, TagResponseDTO, CreateTagRequestDTO, UpdateTagRequestDTO, errorFactory);
const userTagMapper = new UserTagMapper(UserTag, UserTagResponseDTO, UserTagRequestDTO, tagMapper, errorFactory);
const userMapper = new UserMapper(User, UserResponseDTO,AuthResponseDTO,CreateUserRequestDTO,UpdateUserRequestDTO,LoginRequestDTO, userTagMapper, errorFactory);
const taskTagMapper = new TaskTagMapper(TaskTag, tagMapper, TaskTagResponseDTO, TaskTagRequestDTO, errorFactory);
const taskMapper = new TaskMapper(Task, tagMapper, taskTagMapper,TaskResponseDTO,CreateTaskRequestDTO,UpdateTaskRequestDTO,CompleteTaskRequestDTO,TasksSummaryResponseDTO,errorFactory,dateParser);
const sessionMapper = new SessionMapper(Session, SessionResponseDTO, CreateSessionRequestDTO, RefreshSessionRequestDTO,errorFactory);


// DAOs con sus dependencias
const taskDAO = new TaskDAO({taskMapper, connectionDB, errorFactory,inputValidator} );
const taskTagDAO = new TaskTagDAO({taskTagMapper, connectionDB, errorFactory, inputValidator});
const tagDAO = new TagDAO({tagMapper, connectionDB, errorFactory, inputValidator});
const userDAO = new UserDAO({userMapper, connectionDB, errorFactory, inputValidator});
const sessionDAO = new SessionDAO({sessionMapper, connectionDB, errorFactory, inputValidator});

const jwtAuth = new JwtAuth();

// Servicios
const userService = new UserService({userDAO, taskDAO, connectionDB, bcrypt, errorFactory,validator,userMapper });
const tagService = new TagService({tagDAO, connectionDB, errorFactory, validator});
const taskTagService = new TaskTagService({taskTagDAO, connectionDB, errorFactory, validator});
const taskService = new TaskService({taskDAO, tagService, taskTagService, connectionDB, errorFactory, validator});
const sessionService = new SessionService({sessionDAO,jwtAuth,connectionDB, errorFactory, validator});
const authService = new AuthService({User, userService, sessionService, connectionDB, userDAO, jwtAuth, bcrypt, crypto, errorFactory, validator});

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