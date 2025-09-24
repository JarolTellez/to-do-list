class UserController{
    constructor({userService, userMapper}){
        this.userService=userService;
        this.userMapper=userMapper;
    }

     async registerUser(req, res, next) {
    try {
        const createUserRequestDTO = this.userMapper.requestDataToCreateDTO(req.body);
      const addedUser = await this.userService.createUser(createUserRequestDTO);
   
      
      return res.status(201).json({
         success: true,
        data: addedUser
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;