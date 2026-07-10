const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateJWT, getProfile);

module.exports = router;
