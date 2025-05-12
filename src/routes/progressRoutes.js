const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const auth = require('../middleware/auth');

// Obtener progreso del usuario
router.get('/', auth, progressController.getUserProgress);

// Actualizar racha de usuario
router.post('/streak', auth, progressController.updateStreak);

// Recalcular progreso total
router.post('/calculate', auth, progressController.calculateTotalProgress);

// Obtener recomendación de siguiente contenido
router.get('/next', auth, progressController.getNextContent);

module.exports = router;
