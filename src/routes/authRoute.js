const router = require('express').Router();
const { userRegister } = require('../controller/authController.js');

router.post('/user-register', userRegister);

module.exports = router;
