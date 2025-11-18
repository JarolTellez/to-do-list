const { clearAuthCookies } = require("../utils/cookieUtils");

/**
 * User management controller for handling user-related API endpoints
 * @class UserController
 * @description Handles user registration, profile updates, and account management
 */
class UserController {
  /**
   * Creates a new UserController instance
   * @constructor
   * @param {Object} dependencies - Controller dependencies
   * @param {UserService} dependencies.userService - User service instance
   * @param {Object} dependencies.userMapper - User mapper for data transformation
   */
  constructor({ userService, userMapper }) {
    this.userService = userService;
    this.userMapper = userMapper;
  }

  /**
   * Registers a new user account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with created user
   */
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

  /**
   * Updates current user profile information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with update result
   */
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

      clearAuthCookies(res);
      return res.status(200).json({
        success: true,
        message: "Usuario actualizado",
        requiresReauth: result.sessionsClosed,
        criticalChanges: result.criticalChanges,
        data: userResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates current user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with password update result
   */
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

      clearAuthCookies(res);
      return res.status(200).json({
        success: true,
        message: "Contrasena actualizada",
        requiresReauth: result.sessionsClosed,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes current user account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with account deletion result
   */
  async deleteUser(req, res, next) {
    try {
      const userId = req.user.userId;
      const requestingUserId = req.user.userId;

      const result = await this.userService.deleteUser(
        userId,
        requestingUserId
      );
      clearAuthCookies(res);
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
