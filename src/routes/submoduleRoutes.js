const express = require('express');
const router = express.Router();

const submoduleController = require('../controllers/submoduleController');
const auth = require('../middleware/auth');

const { isAdmin } = require('../middleware/roleValidator');
const {
  createSubmoduleValidator,
  updateSubmoduleValidator,
} = require('../middleware/validators/submoduleValidator');

router.post('/', auth, isAdmin, createSubmoduleValidator, submoduleController.createSubModule);
router.put('/:id', auth, isAdmin, updateSubmoduleValidator, submoduleController.updateSubModule);

router.post('/:id/start', auth, submoduleController.startSubModule);
router.post('/:id/complete', auth, submoduleController.completeSubModule);

module.exports = router;
