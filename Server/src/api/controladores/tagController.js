class TagController {
  constructor({ tagService, tagMapper }) {
    this.tagService = tagService;
    this.tagMapper = tagMapper;
  }

  async getAllTagsByUserId(req, res, next) {
    const userId = req.user.userId;

    try {
      const tags = await this.tagService.getAllTagsByUserId(userId);
      return res.status(200).json({
        success: true,
        message:
          tags.length === 0
            ? "No se encontraron etiquetas para este usuario"
            : "Etiquetas consultadas exitosamente",
        data: tags,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TagController;
