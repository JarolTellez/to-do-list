class UserController {
  constructor({ userService, userMapper }) {
    this.userService = userService;
    this.userMapper = userMapper;
  }

  async registerUser(req, res, next) {
    try {
      const createUserRequestDTO = this.userMapper.requestDataToCreateDTO(
        req.body
      );
      const addedUser = await this.userService.createUser(createUserRequestDTO);

      const userResponse = this.userMapper.domainToResponse(addedUser);

      return res.status(201).json({
        success: true,
        data: userResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const userId = req.user.userId;
      const userData = {
        ...req.body,
        userId,
      };

      const updateUserRequestDTO =
        this.userMapper.requestDataToUpdateDTO(userData);
      const result = await this.userService.updateUser(updateUserRequestDTO);

      const userResponse = this.userMapper.domainToResponse(result.user);

      return res.status(200).json({
        success: true,
        message: "Usuario actualizado correctamente",
        requiresReauth: result.sessionsClosed,
        criticalChanges: result.criticalChanges,
        data: userResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserPassword(req, res, next) {
    try {
      const userId = req.user.userId;
      const updatePasswordData = {
        ...req.body,
        userId: userId,
      };

      const result = await this.userService.updateUserPassword(
        updatePasswordData
      );

      return res.status(200).json({
        success: true,
        message: "Contrasena actualizada",
        requiresReauth: result.sessionsClosed,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const userId = req.user.userId;
      const requestingUserId = req.user.userId;

      const result = await this.userService.deleteUser(
        userId,
        requestingUserId
      );

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
