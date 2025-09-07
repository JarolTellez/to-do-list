const express = require('express');
const {validateAccessToken} = require('../middlewares/validateAccessToken');
module.exports = (tagController) => {
  const router = express.Router();

  router.route('/')
    .post(validateAccessToken,tagController.getAllTagsByUserId.bind(tagController));

  return router;
};