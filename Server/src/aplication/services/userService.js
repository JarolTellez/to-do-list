class UserService {
  constructor({
    userDAO,
    taskDAO,
    tagService,
    authService,
    dbManager,
    bcrypt,
    errorFactory,
    validator,
    userMapper,
    paginationHelper,
    errorMapper,
    validationConfig
  }) {
    this.dbManager = dbManager;
    this.userDAO = userDAO;
    this.tagService = tagService;
    this.authService = authService;
    this.taskDAO = taskDAO;
    this.bcrypt = bcrypt;
    this.errorFactory = errorFactory;
    this.validator = validator;
    this.userMapper = userMapper;
    this.paginationHelper = paginationHelper;
    this.errorMapper = errorMapper;
    this.validationConfig = validationConfig;
  }

  async createUser(createUserRequestDTO, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(
        ["username", "email", "password"],
        createUserRequestDTO
      );
      return this.dbManager.withTransaction(async (dbClient) => {
        const [existingByEmail, existingByUsername] = await Promise.all([
          this.userDAO.findByEmail(createUserRequestDTO.email, dbClient),
          this.userDAO.findByUsername(createUserRequestDTO.username, dbClient),
        ]);
        if (existingByEmail) {
          throw this.errorFactory.createConflictError(
            "El email ya está registrado",
            {
              email: createUserRequestDTO.email,
              operation: "createUser",
            }
          );
        }
        if (existingByUsername) {
          throw this.errorFactory.createConflictError(
            "El nombre de usuario no está disponible",
            {
              username: createUserRequestDTO.username,
              operation: "createUser",
            }
          );
        }

        this.validator.validateText(createUserRequestDTO.password, "password", {
          minLength: this.validationConfig.USER.PASSWORD.MIN_LENGTH,
          maxLength: this.validationConfig.USER.PASSWORD.MAX_LENGTH,
          required: true,
        });

        const hashedPassword = await this.bcrypt.hash(
          createUserRequestDTO.password,
          10
        );

        const userDomain = this.userMapper.createRequestToDomain({
          ...createUserRequestDTO,
          password: hashedPassword,
        });

        const createdUser = await this.userDAO.create(userDomain, dbClient);
        if (!createdUser) {
          throw this.errorFactory.createDatabaseError(
            "Error al crear el usuario",
            {
              userData: {
                username: createUserRequestDTO.username,
                email: createUserRequestDTO.email,
              },
              operation: "createUser",
            }
          );
        }

        return this.userMapper.domainToResponse(createdUser);
      }, externalDbClient);
    });
  }

  async updateUser(updateUserRequestDTO, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["id"], updateUserRequestDTO);

      return this.dbManager.withTransaction(async (dbClient) => {
        const existingUser = await this.userDAO.findById(
          updateUserRequestDTO.id,
          dbClient
        );

        if (!existingUser) {
          throw this.errorFactory.createNotFoundError(
            "Usuario no encontrado para actualizar",
            {
              userId: updateUserRequestDTO.id,
              operation: "updateUser",
            }
          );
        }
        if (
          updateUserRequestDTO.email &&
          updateUserRequestDTO.email !== existingUser.email
        ) {
          const existingByEmail = await this.userDAO.findByEmail(
            updateUserRequestDTO.email,
            dbClient
          );
          if (existingByEmail) {
            throw this.errorFactory.createConflictError(
              "El email ya está en uso",
              {
                email: updateUserRequestDTO.email,
                currentUserId: updateUserRequestDTO.id,
                operation: "updateUser",
              }
            );
          }
        }

        if (
          updateUserRequestDTO.username &&
          updateUserRequestDTO.username !== existingUser.username
        ) {
          const existingByUsername = await this.userDAO.findByUsername(
            updateUserRequestDTO.username,
            dbClient
          );
          if (existingByUsername) {
            throw this.errorFactory.createConflictError(
              "El nombre de usuario ya está en uso",
              {
                username: updateUserRequestDTO.username,
                currentUserId: updateUserRequestDTO.id,
                operation: "updateUser",
              }
            );
          }
        }

        const criticalChanges = this.detectCriticalChanges(
          existingUser,
          updateUserRequestDTO
        );

        const userDomain =
          this.userMapper.updateRequestToDomain(updateUserRequestDTO);
        const updatedUser = await this.userDAO.update(userDomain, dbClient);

        if (!updatedUser) {
          throw this.errorFactory.createDatabaseError(
            "Error al actualizar el usuario",
            {
              userId: updateUserRequestDTO.id,
              operation: "updateUser",
              updateData: userDomain,
            }
          );
        }

        let sessionsClosed = false;
        if (criticalChanges.hasCriticalChanges) {
          await this.authService.deactivateAllUserSessions(
            updatedUser.id,
            dbClient
          );
          sessionsClosed = true;
        }

        return {
          user: updatedUser,
          criticalChanges,
          sessionsClosed,
        };
      }, externalDbClient);
    });
  }

  detectCriticalChanges(existingUser, updateData) {
    const changes = {
      emailChanged: updateData.email && updateData.email !== existingUser.email,
      usernameChanged:
        updateData.username && updateData.username !== existingUser.username,
      roleChanged: updateData.rol && updateData.rol !== existingUser.rol,
      hasCriticalChanges: false,
    };

    changes.hasCriticalChanges =
      changes.emailChanged || changes.usernameChanged || changes.roleChanged;
    return changes;
  }

  async updateUserPassword(updatePasswordRequestDTO, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(
        ["userId", "currentPassword", "newPassword"],
        updatePasswordRequestDTO
      );

      return this.dbManager.withTransaction(async (dbClient) => {
        const user = await this.validateUserExistenceById(
          updatePasswordRequestDTO.userId,
          dbClient
        );

        const isCurrentPasswordValid = await this.bcrypt.compare(
          updatePasswordRequestDTO.currentPassword,
          user.password
        );

        if (!isCurrentPasswordValid) {
          throw this.errorFactory.createAuthenticationError(
            "La contraseña actual es incorrecta",
            {
              userId: updatePasswordRequestDTO.userId,
              operation: "updatePassword",
              errorType: "invalid_current_password",
            }
          );
        }

        const hashedNewPassword = await this.bcrypt.hash(
          updatePasswordRequestDTO.newPassword,
          10
        );

        const updatedUser = await this.userDAO.updatePassword(
          updatePasswordRequestDTO.userId,
          hashedNewPassword,
          dbClient
        );

        if (!updatedUser) {
          throw this.errorFactory.createDatabaseError(
            "Error al actualizar la contraseña en la base de datos",
            {
              userId: updatePasswordRequestDTO.userId,
              operation: "updatePassword",
            }
          );
        }

        await this.authService.deactivateAllUserSessions(
          updatedUser.id,
          dbClient
        );

        return {
          success: true,
          sessionsClosed: true,
        };
      }, externalDbClient);
    });
  }

  async deleteUser(userId, requestingUserId, externalDbClient = null) {
    this.validator.validateRequired(["userId", "requestingUserId"], {
      userId,
      requestingUserId,
    });
    if (userId !== requestingUserId) {
      throw this.errorFactory.createForbiddenError(
        "No tienes permisos para eliminar este usuario",
        {
          attemptingUserId: requestingUserId,
          targetUserId: userId,
          operation: "deleteUser",
        }
      );
    }

    return this.dbManager.withTransaction(async (dbClient) => {
      await this.validateUserExistenceById(userId, dbClient);

      const result = await this.userDAO.delete(userId, dbClient);

      if (!result) {
        throw this.errorFactory.createDatabaseError(
          "Error al eliminar el usuario de la base de datos",
          {
            userId: userId,
            operation: "deleteUser",
          }
        );
      }

      return { success: true };
    }, externalDbClient);
  }

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
          "Credenciales inválidas",
          {
            identifier: identifier,
            identifierType: isEmail ? "email" : "username",
            operation: "validateCredentials",
          }
        );
      }

      const isPasswordValid = await this.bcrypt.compare(
        password,
        user.password
      );
      if (!isPasswordValid) {
        throw this.errorFactory.createAuthenticationError(
          "Credenciales inválidas",
          {
            userId: user.id,
            identifier: identifier,
            operation: "validateCredentials",
          }
        );
      }

      return user;
    }, externalDbClient);
  }

  async getByEmail(email, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      return this.dbManager.forRead(async (dbClient) => {
        const user = await this.userDAO.getByEmail(email, dbClient);
        if (!user) {
          throw this.errorFactory.createNotFoundError(
            "Usuario no encontrado con el email proporcionado",
            {
              email: email,
              operation: "getByEmail",
            }
          );
        }
        return user;
      }, externalDbClient);
    });
  }

  async getById(userId, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      return this.dbManager.forRead(async (dbClient) => {
        const user = await this.userDAO.findById(userId, dbClient);
        if (!user) {
          throw this.errorFactory.createNotFoundError("Usuario no encontrado", {
            userId: userId,
            operation: "getById",
          });
        }
        return user;
      }, externalDbClient);
    });
  }

  async getUserWithTags(userId, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      this.validator.validateRequired(["userId"], { userId });

      return this.dbManager.forRead(async (dbClient) => {
        const user = await this.userDAO.findByIdWithUserTags(userId, dbClient);

        if (!user) {
          throw this.errorFactory.createNotFoundError("Usuario no encontrado", {
            userId: userId,
            operation: "getUserWithTags",
          });
        }

        return user;
      }, externalDbClient);
    });
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
        const result = await this.userDAO.assignTags(
          userId,
          tagsToAssign,
          dbClient
        );

        if (!result) {
          throw this.errorFactory.createDatabaseError(
            "Error al asignar etiquetas al usuario",
            {
              userId: userId,
              tagIds: tagsToAssign,
              operation: "ensureUserHasTags",
            }
          );
        }
      }
    }, externalDbClient);
  }

  async processMixedTagsForTask(userId, mixedTags, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      return this.dbManager.withTransaction(async (dbClient) => {
        if (!mixedTags || mixedTags.length === 0) {
          return [];
        }

        // Make suree all tags exist in db, if not creates them
        const tagIds = await this.tagService.processMixedTags(
          mixedTags,
          dbClient
        );

        // Make sure all taks belongs to user in userTag db, if not creates them
        await this.ensureUserHasTags(userId, tagIds, dbClient);

        //Verify user is owner of all tags defined
        await this.validateUserOwnsTags(userId, tagIds, dbClient);
        return tagIds;
      }, externalDbClient);
    });
  }

  async validateUserExistenceById(userId, externalDbClient = null) {
    this.validator.validateRequired(["userId"], { userId });
    return this.dbManager.forRead(async (dbClient) => {
      const user = await this.userDAO.findById(userId, dbClient);
      if (!user) {
        throw this.errorFactory.createNotFoundError("Usuario no encontrado", {
          userId: userId,
          operation: "validateUserExistenceById",
        });
      }
      return user;
    }, externalDbClient);
  }
  async validateUserOwnsTags(userId, tagIds, externalDbClient = null) {
    return this.errorMapper.executeWithErrorMapping(async () => {
      return this.dbManager.forRead(async (dbClient) => {
        if (!tagIds || tagIds.length === 0) {
          return true;
        }

        const userTagIds = await this.userDAO.hasTags(userId, tagIds, dbClient);

        // Verify user has all tags defined in tagIds in userTag db
        const missingTags = tagIds.filter(
          (tagId) => !userTagIds.includes(tagId)
        );

        if (missingTags.length > 0) {
          const missingTagsData = await this.tagService.getTagsByIds(
            missingTags,
            dbClient
          );
          const missingTagNames = missingTagsData.map((t) => t.name);

          throw this.errorFactory.createForbiddenError(
            `No tienes permisos sobre las etiquetas: ${missingTagNames.join(
              ", "
            )}`,
            {
              userId,
              missingTagIds: missingTags,
              missingTagNames: missingTagNames,
              operation: "validateUserOwnsTags",
              requiredPermission: "tag_ownership",
            }
          );
        }

        return true;
      }, externalDbClient);
    });
  }
}

module.exports = UserService;
