const express = require('express');
module.exports =(userController)=>{
    const router = express.Router();

    router.route('/').post(userController.registerUser.bind(userController));

    return router;
}