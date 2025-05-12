const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleValidator');

// Obtener línea de tiempo de actividad
router.get('/', auth, activityController.getActivityTimeline);
router.get('/:id', auth, isAdmin, activityController.getActivityTimeline);

module.exports = router;
