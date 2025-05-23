// controllers/userChallengeController.js
const userChallengeService = require('../services/userChallengeService');
const { success } = require('../utils/responseFormatter');

exports.getUserChallenges = async (req, res, next) => {
  try {
    const userChallenges = await userChallengeService.getUserChallenges(req.user.id);
    res.status(200).json(success(userChallenges, 'Desafíos del usuario obtenidos con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getUserChallengeStats = async (req, res, next) => {
  try {
    const stats = await userChallengeService.getUserChallengeStats(req.user.id);
    res.status(200).json(success(stats, 'Estadísticas obtenidas con éxito'));
  } catch (err) {
    next(err);
  }
};
