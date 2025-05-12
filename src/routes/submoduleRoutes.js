const express = require('express');
const router = express.Router();
const submoduleController = require('../controllers/submoduleController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleValidator');
const { submoduleValidator } = require('../middleware/validators/submoduleValidator');

// Obtener todos los submódulos o filtrar por moduleId
router.get('/', submoduleController.getAllSubModules);
// Obtener un submódulo específico
router.get('/:id', submoduleController.getSubModuleById);
// Iniciar un submódulo (usuario autenticado)
router.post('/:id/start', auth, submoduleController.startSubModule);
// Completar un submódulo (usuario autenticado)
router.post('/:id/complete', auth, submoduleController.completeSubModule);

// Solo admin puede crear, actualizar y eliminar submódulos
router.post('/', auth, isAdmin, submoduleValidator, submoduleController.createSubModule);
router.put('/:id', auth, isAdmin, submoduleValidator, submoduleController.updateSubModule);
router.delete('/:id', auth, isAdmin, submoduleController.deleteSubModule);

module.exports = router;
