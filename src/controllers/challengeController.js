const challengeService = require('../services/challengeService');
const { validationResult } = require('express-validator');
const { success } = require('../utils/responseFormatter');

exports.getAllChallenges = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const challenges = await challengeService.getAllChallenges(userId);
    res.json(success(challenges, 'Desafíos obtenidos con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getChallengeById = async (req, res, next) => {
  try {
    const challengeId = req.params.id;
    const userId = req.user ? req.user.id : null;

    const challenge = await challengeService.getChallengeById(challengeId, userId);
    res.json(success(challenge, 'Desafío obtenido con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.createChallenge = async (req, res, next) => {
  try {
    // Validar inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const challenge = await challengeService.createChallenge(req.body);
    res.status(201).json(success(challenge, 'Desafío creado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.updateChallenge = async (req, res, next) => {
  try {
    // Validar inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const challengeId = req.params.id;
    const challenge = await challengeService.updateChallenge(challengeId, req.body);

    res.json(success(challenge, 'Desafío actualizado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.deleteChallenge = async (req, res, next) => {
  try {
    const challengeId = req.params.id;
    const result = await challengeService.deleteChallenge(challengeId);

    res.json(success(null, result.message));
  } catch (err) {
    next(err);
  }
};

exports.startChallenge = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const challengeId = req.params.id;

    const userChallenge = await challengeService.startChallenge(userId, challengeId);
    res.json(success(userChallenge, 'Desafío iniciado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.submitChallengeSolution = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const challengeId = req.params.id;
    const solutionData = req.body;

    if (!solutionData.solution) {
      return res.status(400).json({ message: 'La solución es requerida' });
    }

    const result = await challengeService.submitChallengeSolution(
      userId,
      challengeId,
      solutionData
    );

    if (result.passed) {
      res.json(success(result, '¡Felicidades! Tu solución es correcta'));
    } else {
      res.json(success(result, 'La solución es incorrecta. ¡Inténtalo de nuevo!'));
    }
  } catch (err) {
    next(err);
  }
};

exports.getSolutionsForChallenge = async (req, res, next) => {
  try {
    const challengeId = req.params.id;
    const userId = req.query.userId;

    // Verificar permisos si se pide soluciones de un usuario específico
    if (userId && req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para ver estas soluciones' });
    }

    const solutions = await challengeService.getSolutionsForChallenge(challengeId, userId);
    res.json(success(solutions, 'Soluciones obtenidas con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.markSolutionAsFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const solutionId = req.params.id;

    const solution = await challengeService.markSolutionAsFavorite(userId, solutionId);
    res.json(success(solution, 'Solución marcada como favorita con éxito'));
  } catch (err) {
    next(err);
  }
};
