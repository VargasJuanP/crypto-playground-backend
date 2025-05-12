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
router.get('/profile/:id', auth, userController.getUserProfile);

// Actualizar perfil de usuario
router.put('/profile', auth, updateUserValidator, userController.updateUserProfile);
router.put('/profile/:id', auth, updateUserValidator, userController.updateUserProfile);

// Subir imagen de perfil
router.post('/profile/image', auth, uploadSingle, userController.uploadProfileImage);
router.post('/profile/:id/image', auth, uploadSingle, userController.uploadProfileImage);

// Obtener módulos del usuario
router.get('/modules', auth, userController.getUserModules);
router.get('/:id/modules', auth, userController.getUserModules);

// Obtener submódulos del usuario
router.get('/submodules', auth, userController.getUserSubModules);
router.get('/:id/submodules', auth, userController.getUserSubModules);

// Obtener desafíos del usuario
router.get('/challenges', auth, userController.getUserChallenges);
router.get('/:id/challenges', auth, userController.getUserChallenges);

// Obtener soluciones del usuario
router.get('/solutions', auth, userController.getUserSolutions);
router.get('/:id/solutions', auth, userController.getUserSolutions);

// Obtener estadísticas del usuario
router.get('/statistics', auth, userController.getUserStatistics);
router.get('/:id/statistics', auth, userController.getUserStatistics);

// Eliminar usuario (solo admin o propio usuario)
router.delete('/:id', auth, userController.deleteUser);

module.exports = router;
