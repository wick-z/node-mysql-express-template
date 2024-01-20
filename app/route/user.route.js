const express = require('express');
const router = express.Router();
const { UserService } = require('../controller/user.controller');

router.get('/', UserService.getUsers);
router.get('/batch', UserService.batchAddUser);

module.exports = router;