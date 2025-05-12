const progressService = require('../services/progressService');
const { success } = require('../utils/responseFormatter');

exports.getUserProgress = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id;

    // Verificar permisos
    if (req.params.id && req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para ver este progreso' });
    }

    const progress = await progressService.getUserProgress(userId);
    res.json(success(progress, 'Progreso del usuario obtenido con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.updateStreak = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await progressService.updateUserStreak(userId);
    res.json(success(result, 'Racha actualizada con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.calculateTotalProgress = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id;

    // Verificar permisos
    if (req.params.id && req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para calcular este progreso' });
    }

    const result = await progressService.calculateTotalProgress(userId);
    res.json(success(result, 'Progreso total calculado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getNextContent = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const nextContent = await progressService.getNextContent(userId);
    res.json(success(nextContent, 'Siguiente contenido recomendado obtenido con éxito'));
  } catch (err) {
    next(err);
  }
};
