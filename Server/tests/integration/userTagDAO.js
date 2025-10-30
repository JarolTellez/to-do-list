// test-user-dao.js
require("dotenv").config({ path: "../../.env" });

const UserDAO = require("../../src/infrastructure/daos/userDAO.js");
const User = require("../../src/domain/entities/user.js");
const UserTag = require("../../src/domain/entities/userTag.js");
const Tag = require("../../src/domain/entities/tag.js");
const UserResponseDTO = require("../../src/aplication/dtos/response_dto/userResponseDTO.js");
const ConnectionDB = require("../../src/infrastructure/config/connectionDB.js");
const UserMapper = require("../../src/infrastructure/mappers/userMapper.js");
const UserTagMapper = require("../../src/infrastructure/mappers/userTagMapper.js");
const TagMapper = require("../../src/infrastructure/mappers/tagMapper.js");
const ErrorFactory = require("../../src/infrastructure/utils/errors/errorFactory.js");
const InputValidator = require("../../src/infrastructure/utils/validation/inputValidator.js");
const {
  NotFoundError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  ConflictError,
  RateLimitError,
  ForbiddenError,
  ServiceUnavailableError,
  AppError,
} = require("../../src/infrastructure/utils/errors/appErrors.js");
const ErrorCodes = require("../../src/infrastructure/utils/errors/errorCodes.js");
const connectionDB = ConnectionDB.getInstance();
const errorFactory = new ErrorFactory(
  NotFoundError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  ConflictError,
  RateLimitError,
  ForbiddenError,
  ServiceUnavailableError,
  AppError,
  ErrorCodes
);
const inputValidator = new InputValidator(errorFactory);

const tagMapper = new TagMapper(Tag);
const userTagMapper = new UserTagMapper(UserTag, tagMapper);
const userMapper = new UserMapper(User, UserResponseDTO, userTagMapper);
const userDAO = new UserDAO({ userMapper, connectionDB, errorFactory, inputValidator});

async function testFindByIdWithUserTags() {
  let connection;

  try {
    connection = await connectionDB.connect();

    const userId = 13;
    const userWithTags = await userDAO.findByIdWithUserTags(userId, connection);

    if (userWithTags) {
      console.log("Resultado:", JSON.stringify(userWithTags, null, 2));
    } else {
      console.log("Usuario no encontrado");
    }
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Details:", error.details || error);
  } finally {
    if (connection) {
      await connection.release();
    }

    await connectionDB.closePool();
  }
}

testFindByIdWithUserTags();
