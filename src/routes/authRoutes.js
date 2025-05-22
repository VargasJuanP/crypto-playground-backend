const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../middleware/validators/userValidator');

// Ruta de registro
router.post('/register', registerValidator, authController.register);

// Ruta de login
router.post('/login', loginValidator, authController.login);

// Obtener usuario actual
router.get('/me', auth, authController.getMe);

module.exports = router;
