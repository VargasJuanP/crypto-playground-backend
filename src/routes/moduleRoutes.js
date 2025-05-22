const express = require('express');
const router = express.Router();

const moduleController = require('../controllers/moduleController');
const auth = require('../middleware/auth');

const { isAdmin } = require('../middleware/roleValidator');
const {
  createModuleValidator,
  updateModuleValidator,
} = require('../middleware/validators/moduleValidator');

router.post('/', auth, isAdmin, createModuleValidator, moduleController.createModule);
router.put('/:id', auth, isAdmin, updateModuleValidator, moduleController.updateModule);

// Obtener todos los módulos con información del usuario si está autenticado
router.get('/', auth, moduleController.getModules);

router.post('/:id/start', auth, moduleController.startModule);

router.post('/:id/complete', auth, moduleController.completeModule);

module.exports = router;
