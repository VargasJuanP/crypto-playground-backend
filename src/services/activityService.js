const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const Module = require('../models/Module');
const SubModule = require('../models/SubModule');
const Challenge = require('../models/Challenge');
const { error } = require('../utils/responseFormatter');

exports.getUserActivity = async (userId, limit = 10, page = 1) => {
  const skip = (page - 1) * limit;

  // Verificar que existe el usuario
  const user = await User.findById(userId);
  if (!user) {
    throw error('Usuario no encontrado', 404);
  }

  // Obtener logs de actividad
  const activityLogs = await ActivityLog.find({ userId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  // Obtener total de registros para paginación
  const total = await ActivityLog.countDocuments({ userId });

  // Enriquecer los datos de actividad con información adicional
  const enrichedLogs = await Promise.all(
    activityLogs.map(async (log) => {
      const result = {
        id: log._id,
        action: log.action,
        timestamp: log.timestamp,
        details: log.details,
      };

      // Agregar información contextual según el tipo de entidad
      if (log.entityType === 'module' && log.entityId) {
        const module = await Module.findById(log.entityId).select('title');
        if (module) {
          result.entity = {
            type: 'module',
            id: log.entityId,
            title: module.title,
          };
        }
      } else if (log.entityType === 'submodule' && log.entityId) {
        const submodule = await SubModule.findById(log.entityId).select('title moduleId');
        if (submodule) {
          result.entity = {
            type: 'submodule',
            id: log.entityId,
            title: submodule.title,
            moduleId: submodule.moduleId,
          };
        }
      } else if (log.entityType === 'challenge' && log.entityId) {
        const challenge = await Challenge.findById(log.entityId).select('title');
        if (challenge) {
          result.entity = {
            type: 'challenge',
            id: log.entityId,
            title: challenge.title,
          };
        }
      } else if (log.entityType === 'solution' && log.entityId) {
        result.entity = {
          type: 'solution',
          id: log.entityId,
        };
      } else if (log.entityType === 'user' && log.entityId) {
        const targetUser = await User.findById(log.entityId).select('username');
        result.entity = {
          type: 'user',
          id: log.entityId,
          username: targetUser ? targetUser.username : 'Usuario desconocido',
        };
      }

      return result;
    })
  );

  return {
    activities: enrichedLogs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

exports.getActivityStats = async (userId) => {
  // Verificar que existe el usuario
  const user = await User.findById(userId);
  if (!user) {
    throw error('Usuario no encontrado', 404);
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Estadísticas generales
  const totalActivities = await ActivityLog.countDocuments({ userId });
  const lastActivity = await ActivityLog.findOne({ userId })
    .sort({ timestamp: -1 })
    .select('timestamp action');

  // Actividades por tipo en la última semana
  const weeklyActivities = await ActivityLog.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: oneWeekAgo },
      },
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
      },
    },
  ]);

  // Actividad por día en el último mes
  const dailyActivity = await ActivityLog.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: oneMonthAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Actividad por tipo de entidad
  const entityTypeActivity = await ActivityLog.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: '$entityType',
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    totalActivities,
    lastActivity: lastActivity
      ? {
          timestamp: lastActivity.timestamp,
          action: lastActivity.action,
        }
      : null,
    weeklyActivityByType: weeklyActivities.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    dailyActivity: dailyActivity.map((item) => ({
      date: item._id,
      count: item.count,
    })),
    entityTypeActivity: entityTypeActivity.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
  };
};

exports.logActivity = async (userId, action, entityType, entityId, details = {}) => {
  const activityLog = new ActivityLog({
    userId,
    action,
    entityType,
    entityId,
    details,
  });

  await activityLog.save();
  return activityLog;
};

exports.getRecentActivities = async (limit = 20) => {
  const activities = await ActivityLog.find()
    .populate('userId', 'username')
    .sort({ timestamp: -1 })
    .limit(limit);

  return activities.map((activity) => ({
    id: activity._id,
    username: activity.userId.username,
    action: activity.action,
    entityType: activity.entityType,
    timestamp: activity.timestamp,
    details: activity.details,
  }));
};

exports.getActivityTimeline = async (userId, startDate, endDate) => {
  const query = { userId };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const activities = await ActivityLog.find(query).sort({ timestamp: 1 });

  return activities.map((activity) => ({
    id: activity._id,
    action: activity.action,
    entityType: activity.entityType,
    entityId: activity.entityId,
    timestamp: activity.timestamp,
    details: activity.details,
  }));
};
