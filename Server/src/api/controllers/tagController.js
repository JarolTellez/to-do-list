/**
 * Tag management controller for handling tag-related API endpoints
 * @class TagController
 * @description Handles tag retrieval and management operations
 */
class TagController {
  /**
   * Creates a new TagController instance
   * @constructor
   * @param {Object} dependencies - Controller dependencies
   * @param {TagService} dependencies.tagService - Tag service instance
   * @param {Object} dependencies.tagMapper - Tag mapper for data transformation
   */
  constructor({ tagService, tagMapper }) {
    this.tagService = tagService;
    this.tagMapper = tagMapper;
  }

  /**
   * Retrieves all tags for the current user with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<Object>} JSON response with paginated tag list
   */
  async getAllTagsByUserId(req, res, next) {
    const userId = req.user.userId;

    try {
      const { page, limit, sortBy, sortOrder } = req.query;

      const paginatedTags = await this.tagService.getAllTagsByUserId(userId, {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        sortBy,
        sortOrder,
      });

      const mappedTags = this._mapPaginationResponse(paginatedTags);
      return res.status(200).json({
        success: true,
        message:
          mappedTags.length === 0
            ? "No se encontraron etiquetas para este usuario"
            : "Etiquetas consultadas exitosamente",
        data: mappedTags,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Maps pagination response with domain to response transformation
   * @private
   * @param {Object} paginationResponse - Paginated response from service
   * @returns {Object} Mapped pagination response with transformed data
   */
  _mapPaginationResponse(paginationResponse) {
    if (!paginationResponse || !paginationResponse.tags) {
      return paginationResponse;
    }
    const tagsArray = Array.isArray(paginationResponse.tags)
      ? paginationResponse.tags
      : [];

    return {
      ...paginationResponse,
      tags: tagsArray.map((tag) => this.tagMapper.domainToResponse(tag)),
    };
  }
}

module.exports = TagController;
