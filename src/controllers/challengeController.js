// controllers/challengeController.js
const { validationResult } = require('express-validator');
const challengeService = require('../services/challengeService');
const { success } = require('../utils/responseFormatter');

exports.createChallenge = async (req, res, next) => {
  try {
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const challenge = await challengeService.updateChallenge(req.params.id, req.body);
    res.status(200).json(success(challenge, 'Desafío actualizado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getChallenge = async (req, res, next) => {
  try {
    const challenge = await challengeService.getChallengeById(req.params.id, req.user.id);
    res.status(200).json(success(challenge, 'Desafío obtenido con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getChallenges = async (req, res, next) => {
  try {
    const { category, difficulty, status } = req.query;
    const challenges = await challengeService.getChallenges(req.user.id, { category, difficulty, status });
    res.status(200).json(success(challenges, 'Desafíos obtenidos con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.startChallenge = async (req, res, next) => {
  try {
    const userChallenge = await challengeService.startChallenge(req.user.id, req.params.id);
    res.status(200).json(success(userChallenge, 'Desafío iniciado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.submitChallenge = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, language } = req.body;
    const result = await challengeService.submitChallenge(req.user.id, req.params.id, code, language);
    
    if (result.success) {
      res.status(200).json(success(result, 'Solución correcta'));
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Solución incorrecta', 
        details: result.details 
      });
    }
  } catch (err) {
    next(err);
  }
};