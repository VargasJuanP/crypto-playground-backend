const activityService = require('../services/activityService');
const { success } = require('../utils/responseFormatter');

exports.getUserActivity = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id;

    // Verificar permisos
    if (req.params.id && req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para ver esta actividad' });
    }

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const activity = await activityService.getUserActivity(userId, limit, page);
    res.json(success(activity, 'Actividad del usuario obtenida con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getActivityStats = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id;

    // Verificar permisos
    if (req.params.id && req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para ver estas estadísticas' });
    }

    const stats = await activityService.getActivityStats(userId);
    res.json(success(stats, 'Estadísticas de actividad obtenidas con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getRecentActivities = async (req, res, next) => {
  try {
    // Solo admin puede ver todas las actividades recientes
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para ver esta información' });
    }

    const limit = parseInt(req.query.limit) || 20;
    const activities = await activityService.getRecentActivities(limit);

    res.json(success(activities, 'Actividades recientes obtenidas con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getActivityTimeline = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id;

    // Verificar permisos
    if (req.params.id && req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para ver esta línea de tiempo' });
    }

    const { startDate, endDate } = req.query;
    const timeline = await activityService.getActivityTimeline(userId, startDate, endDate);

    res.json(success(timeline, 'Línea de tiempo de actividad obtenida con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.logCustomActivity = async (req, res, next) => {
  try {
    // Solo admin puede registrar actividades manualmente
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para registrar actividades' });
    }

    const { userId, action, entityType, entityId, details } = req.body;

    if (!userId || !action || !entityType) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    const activity = await activityService.logActivity(
      userId,
      action,
      entityType,
      entityId,
      details
    );

    res.status(201).json(success(activity, 'Actividad registrada con éxito'));
  } catch (err) {
    next(err);
  }
};
