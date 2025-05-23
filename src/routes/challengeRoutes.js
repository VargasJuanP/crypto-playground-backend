// routes/challengeRoutes.js
const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleValidator');
const {
  createChallengeValidator,
  updateChallengeValidator,
  submitChallengeValidator,
} = require('../middleware/validators/challengeValidator');

// Rutas administrativas
router.post('/', auth, isAdmin, createChallengeValidator, challengeController.createChallenge);
router.put('/:id', auth, isAdmin, updateChallengeValidator, challengeController.updateChallenge);

// Rutas para usuarios
router.get('/', auth, challengeController.getChallenges);
router.get('/:id', auth, challengeController.getChallenge);
router.post('/:id/start', auth, challengeController.startChallenge);
router.post('/:id/submit', auth, submitChallengeValidator, challengeController.submitChallenge);

module.exports = router;
