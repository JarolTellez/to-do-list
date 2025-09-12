class UserTagController{
    constructor({userTagService,userTagMapper}){
        this.userTagService = userTagService;
        this.userTagMapper = userTagMapper;
    }

      async getAllTagsByUserId(req, res, next) {
    const { userId } = req.body;

    try {
      const tags = await this.userTagService.getAllTagsByUserId(userId);

      if (!tags || tags.length === 0) {
        return res.status(200).json({
          status: 'success',
          message: 'No se encontraron tags para este usuario.',
          data: [],
        });
      }

      return res.status(200).json({
        status: 'success',
        data: tags,
      });
    } catch (error) {
      // console.log('Error al consultar las tags: ', error);
      // return res.status(500).json({
      //   status: 'error',
      //   message: 'Error al consultar las tags.',
      //   error: error.message,
      // });
      next(error);
    }
  }
}