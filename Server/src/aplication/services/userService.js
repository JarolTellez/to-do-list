class UserService {
  constructor({
    userDAO,
    taskDAO,
    tagService,
    dbManager,
    bcrypt,
    errorFactory,
    validator,
    userMapper,
    paginationHelper,
  }) {
    this.dbManager = dbManager;
    this.userDAO = userDAO;
    this.tagService = tagService;
    this.taskDAO = taskDAO;
    this.bcrypt = bcrypt;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.userMapper = userMapper;
    this.paginationHelper = paginationHelper;
  }

  async createUser(createUserRequestDTO, externalDbClient = null) {
    this.validator.validateRequired(
      ["username", "email", "password"],
      createUserRequestDTO
    );
    this.validator.validateEmail("email", createUserRequestDTO);
    this.validator.validateLength("username", createUserRequestDTO, {
      min: 3,
      max: 30,
    });
    this.validator.validateLength("password", createUserRequestDTO, {
      min: 6,
      max: 128,
    });

    return this.dbManager.withTransaction(async (dbClient) => {
      const [existingByEmail, existingByusername] = await Promise.all([
        this.userDAO.findByEmail(createUserRequestDTO.email, dbClient),
        this.userDAO.findByUsername(createUserRequestDTO.username, dbClient),
      ]);
      if (existingByEmail) {
        throw this.errorFactory.createConflictError(
          "El email ya está registrado"
        );
      }
      if (existingByusername) {
        throw this.errorFactory.createConflictError(
          "El nombre de usuario ya está en uso"
        );
      }

      const hashedPassword = await this.bcrypt.hash(
        createUserRequestDTO.password,
        10
      );

      const userDomain = this.userMapper.createRequestToDomain({
        ...createUserRequestDTO,
        password: hashedPassword,
      });

      const createdUser = await this.userDAO.create(userDomain, dbClient);

      return this.userMapper.domainToResponse(createdUser);
    }, externalDbClient);
  }

 
  //   this.validator.validateRequired(["userId", "tagNames"], {
  //     userId,
  //     tagNames,
  //   });

  //   return this.dbManager.withTransaction(async (dbClient) => {
  //     // Delegar a TagService la creación de tags
  //     const tags = await this.tagService.createMultipleTags(tagNames, dbClient);
  //     const tagIds = tags.map((t) => t.id);

  //     // Usar UserDAO para asignar tags al usuario
  //     const userWithTags = await this.userDAO.assignTags(
  //       userId,
  //       tagIds,
  //       dbClient
  //     );
  //     return userWithTags;
  //   }, externalDbClient);
  // }

  // En UserService - método assignTagsToUser CORREGIDO
  // En UserService - método assignTagsToUser CORREGIDO
  async assignTagsToUser(userId, tagNames, externalDbClient = null) {
    this.validator.validateRequired(["userId", "tagNames"], {
      userId,
      tagNames,
    });

    return this.dbManager.withTransaction(async (dbClient) => {
      const tagDomains = tagNames.map((name) =>
        this.tagService.tagDAO.tagMapper.createRequestToDomain({
          id: null,
          name: name,
          description: null,
        })
      );
      const tags = await this.tagService.createMultipleTags(
        tagDomains,
        dbClient
      );
      const tagIds = tags.map((t) => t.id);
      const userWithTags = await this.userDAO.assignTags(
        userId,
        tagIds,
        dbClient
      );
      return userWithTags;
    }, externalDbClient);
  }

  async removeTagsFromUser(userId, tagNames, externalDbClient = null) {
    this.validator.validateRequired(["userId", "tagNames"], {
      userId,
      tagNames,
    });

    return this.dbManager.withTransaction(async (dbClient) => {
      const tags = await this.tagService.getByNames(tagNames, dbClient);
      const tagIds = tags.map((t) => t.id);

      if (tagIds.length === 0) {
        return true;
      }

      const result = await this.userDAO.removeTags(userId, tagIds, dbClient);
      return result;
    }, externalDbClient);
  }

  async validateCredentials(loginRequestDTO, externalDbClient = null) {
    this.validator.validateRequired(
      ["identifier", "password"],
      loginRequestDTO
    );

    return this.dbManager.forRead(async (dbClient) => {
      const { identifier, password } = loginRequestDTO;
      const isEmail = this.validator.isValidEmail(identifier);

      let user;
      if (isEmail) {
        user = await this.userDAO.findByEmail(identifier, dbClient);
      } else {
        user = await this.userDAO.findByUsername(identifier, dbClient);
      }

      if (!user) {
        throw this.errorFactory.createAuthenticationError(
          "Credenciales inválidas"
        );
      }

      const isPasswordValid = await this.bcrypt.compare(
        password,
        user.password
      );
      if (!isPasswordValid) {
        throw this.errorFactory.createAuthenticationError(
          "Credenciales inválidas"
        );
      }

      return user;
    }, externalDbClient);
  }

  async getByEmail(email, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      const user = await this.userDAO.getByEmail(email, dbClient);
      if (!user) {
        throw this.errorFactory.createNotFoundError("Usuario no encontrado", {
          attemptedData: { email },
        });
      }
      return user;
    }, externalDbClient);
  }

  async getById(userId, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      const user = await this.userDAO.findById(userId, dbClient);
      if (!user) {
        throw this.errorFactory.createNotFoundError("Usuario no encontrado", {
          attemptedData: { userId },
        });
      }
      return user;
    }, externalDbClient);
  }

  async getUserWithTags(userId, externalDbClient = null) {
    this.validator.validateRequired(["userId"], { userId });

    return this.dbManager.forRead(async (dbClient) => {
      const user = await this.userDAO.findByIdWithUserTags(userId, dbClient);

      if (!user) {
        throw this.errorFactory.createNotFoundError("Usuario no encontrado", {
          attemptedData: { userId },
        });
      }

      return user;
    }, externalDbClient);
  }
  async hasTags(userId, tagNames, externalDbClient = null) {
    this.validator.validateRequired(["userId", "tagNames"], {
      userId,
      tagNames,
    });

    return this.dbManager.forRead(async (dbClient) => {
      const tags = await this.tagService.getByNames(tagNames, dbClient);
      const tagIds = tags.map((t) => t.id);

      if (tagIds.length === 0) {
        return [];
      }

      const userTagIds = await this.userDAO.hasTags(userId, tagIds, dbClient);
      const userTags = tags.filter((tag) => userTagIds.includes(tag.id));
      return userTags.map((t) => t.name);
    }, externalDbClient);
  }


  async ensureUserHasTags(userId, tagIds, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      if (!tagIds || tagIds.length === 0) {
        return;
      }

      const currentUserTagIds = await this.userDAO.hasTags(
        userId,
        tagIds,
        dbClient
      );

      const tagsToAssign = tagIds.filter(
        (tagId) => !currentUserTagIds.includes(tagId)
      );

      if (tagsToAssign.length > 0) {
        await this.userDAO.assignTags(userId, tagsToAssign, dbClient);
      }
    }, externalDbClient);
  }

  async processMixedTagsForTask(userId, mixedTags, externalDbClient = null) {
    return this.dbManager.withTransaction(async (dbClient) => {
      if (!mixedTags || mixedTags.length === 0) {
        return [];
      }

      // make suree all tags exist in db, if not creates them
      const tagIds = await this.tagService.processMixedTags(
        mixedTags,
        dbClient
      );

      // make sure all taks belongs to user in userTag db, if not creates them
      await this.ensureUserHasTags(userId, tagIds, dbClient);

      //verify user is owner of all tags defined
      await this.validateUserOwnsTags(userId, tagIds, dbClient);
      return tagIds;
    }, externalDbClient);
  }

  async validateUserExistenceById(userId, externalDbClient = null) {
    this.validator.validateRequired(["userId"], { userId });
    return this.dbManager.forRead(async (dbClient) => {
      const user = await this.userDAO.findById(userId, dbClient);
      if (!user) {
        throw new this.errorFactory.createNotFoundError(
          "Usuario no encontrado",
          {
            attemptedData: { userId },
          }
        );
      }
      return user;
    }, externalDbClient);
  }
  async validateUserOwnsTags(userId, tagIds, externalDbClient = null) {
    return this.dbManager.forRead(async (dbClient) => {
      if (!tagIds || tagIds.length === 0) {
        return true;
      }

      const userTagIds = await this.userDAO.hasTags(userId, tagIds, dbClient);

      // Verify user has all tags defined in tagIds in userTag db 
      const missingTags = tagIds.filter((tagId) => !userTagIds.includes(tagId));

      if (missingTags.length > 0) {
        const missingTagsData = await this.tagService.getTagsByIds(
          missingTags,
          dbClient
        );
        const missingTagNames = missingTagsData.map((t) => t.name);

        throw this.errorFactory.createValidationError(
          `El usuario no tiene permisos sobre las etiquetas: ${missingTagNames.join(
            ", "
          )}`,
          {
            userId,
            missingTagIds: missingTags,
            missingTagNames: missingTagNames,
          }
        );
      }

      return true;
    }, externalDbClient);
  }
}

module.exports = UserService;
