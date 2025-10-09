class TagController {
  constructor({ tagService, tagMapper }) {
    this.tagService = tagService;
    this.tagMapper = tagMapper;
  }

  async getAllTagsByUserId(req, res, next) {
    const userId = req.user.userId;

    try {
      const {
        page,
        limit,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const paginatedTags = await this.tagService.getAllTagsByUserId(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
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

    _mapPaginationResponse(paginationResponse) {
    if (!paginationResponse || !paginationResponse.tags) {
      return paginationResponse;
    }
    const tagsArray = Array.isArray(paginationResponse.tags) 
      ? paginationResponse.tags 
      : [];

    return {
      ...paginationResponse,
      tags: tagsArray.map(tag => this.tagMapper.domainToResponse(tag))
    };
  }
}

module.exports = TagController;
