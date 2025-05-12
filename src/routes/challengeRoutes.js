const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleValidator');
const { challengeValidator } = require('../middleware/validators/challengeValidator');

// Obtener todos los desafíos
router.get('/', challengeController.getAllChallenges);

// Obtener un desafío específico
router.get('/:id', challengeController.getChallengeById);

// Solo admin puede crear, actualizar y eliminar desafíos
router.post('/', auth, isAdmin, challengeValidator, challengeController.createChallenge);
router.put('/:id', auth, isAdmin, challengeValidator, challengeController.updateChallenge);
router.delete('/:id', auth, isAdmin, challengeController.deleteChallenge);

// Iniciar un desafío (usuario autenticado)
router.post('/:id/start', auth, challengeController.startChallenge);

// Enviar solución a un desafío
router.post('/:id/submit', auth, challengeController.submitChallengeSolution);

// Obtener soluciones para un desafío
router.get('/:id/solutions', auth, challengeController.getSolutionsForChallenge);

// Marcar una solución como favorita
router.post('/solutions/:id/favorite', auth, challengeController.markSolutionAsFavorite);

module.exports = router;
