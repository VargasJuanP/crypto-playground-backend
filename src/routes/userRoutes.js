const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleValidator');
const { updateUserValidator } = require('../middleware/validators/userValidator');
const { uploadSingle } = require('../middleware/uploadMiddleware');

// Obtener todos los usuarios (solo admin)
router.get('/', auth, isAdmin, userController.getAllUsers);

// Obtener perfil de usuario
router.get('/profile', auth, userController.getUserProfile);

// Actualizar perfil de usuario
router.put('/profile', auth, updateUserValidator, userController.updateUserProfile);

// Subir imagen de perfil
router.post('/profile/image', auth, uploadSingle, userController.uploadProfileImage);

// Obtener módulos del usuario
router.get('/modules', auth, userController.getUserModules);
router.get('/:id/modules', auth, userController.getUserModules);

// Obtener submódulos del usuario
router.get('/submodules', auth, userController.getUserSubModules);
router.get('/:id/submodules', auth, userController.getUserSubModules);

// Eliminar usuario (solo admin o propio usuario)
router.delete('/', auth, userController.deleteUser);
router.delete('/:id', auth, userController.deleteUser);

module.exports = router;
