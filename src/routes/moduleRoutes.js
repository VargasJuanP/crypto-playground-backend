const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleValidator');
const { moduleValidator } = require('../middleware/validators/moduleValidator');

// Obtener todos los módulos con información del usuario si está autenticado
router.get('/', auth, moduleController.getAllModules);

// Obtener un módulo específico básico (usuario autenticado)
router.get('/:id', auth, moduleController.getCompleteModule);
// Iniciar un módulo (usuario autenticado)
router.post('/:id/start', auth, moduleController.startModule);
// Completar un módulo (usuario autenticado)
router.post('/:id/complete', auth, moduleController.completeModule);

// Solo admin puede crear, actualizar y eliminar módulos
router.post('/', auth, isAdmin, moduleValidator, moduleController.createModule);
router.put('/:id', auth, isAdmin, moduleValidator, moduleController.updateModule);
router.delete('/:id', auth, isAdmin, moduleController.deleteModule);

module.exports = router;
