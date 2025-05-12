const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const UserModule = require('../models/UserModule');
const UserSubModule = require('../models/UserSubModule');
const UserChallenge = require('../models/UserChallenge');
const ChallengeSolution = require('../models/ChallengeSolution');
const ActivityLog = require('../models/ActivityLog');
const { error } = require('../utils/responseFormatter');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

exports.getAllUsers = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments();

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

exports.getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw error('Usuario no encontrado', 404);
  }

  // Obtener progreso
  const progress = await UserProgress.findOne({ userId });

  // Calcular días desde la última actividad
  const lastActivityDays = Math.floor((new Date() - user.lastActivity) / (1000 * 60 * 60 * 24));
  const lastActivityText =
    lastActivityDays === 0
      ? 'hoy'
      : lastActivityDays === 1
        ? 'ayer'
        : `hace ${lastActivityDays} días`;

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    level: user.level,
    progress: progress ? progress.totalProgress : 0,
    completedModules: progress ? progress.completedModules : 0,
    totalModules: progress ? progress.totalModules : 0,
    completedSubModules: progress ? progress.completedSubModules : 0,
    totalSubModules: progress ? progress.totalSubModules : 0,
    completedChallenges: progress ? progress.completedChallenges : 0,
    totalChallenges: progress ? progress.totalChallenges : 0,
    currentStreak: progress ? progress.currentStreak : 0,
    maxStreak: progress ? progress.maxStreak : 0,
    lastActivity: lastActivityText,
  };
};

exports.updateUserProfile = async (userId, userData, isAdmin = false) => {
  // Si no es admin solo puede actualizar su propio perfil
  if (!isAdmin && userData.role) {
    delete userData.role; // Protege el cambio de rol si no es admin
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: userData },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw error('Usuario no encontrado', 404);
  }

  // Registrar actividad
  await ActivityLog.create({
    userId,
    action: 'profile_updated',
    entityType: 'user',
    entityId: userId,
    details: { fields: Object.keys(userData) },
  });

  return user;
};

// Reemplazar el método getUserModules en userService.js por esta versión:
exports.getUserModules = async (userId) => {
  // Obtener todos los módulos disponibles
  const allModules = await Module.find().sort({ order: 1 });

  // Obtener los módulos iniciados por el usuario
  const userModules = await UserModule.find({ userId }).lean();
  const userModulesMap = {};

  userModules.forEach((um) => {
    userModulesMap[um.moduleId.toString()] = um;
  });

  // Combinar información y devolver todos los módulos con información del usuario si existe
  return allModules.map((module) => {
    const userModule = userModulesMap[module._id.toString()];

    return {
      id: module._id,
      title: module.title,
      description: module.description,
      level: module.level,
      duration: module.duration,
      order: module.order,
      subModulesCount: module.subModules ? module.subModules.length : 0,
      hasChallenge: !!module.challengeId,
      progress: userModule ? userModule.progress : 0,
      status: userModule ? userModule.status : 'not-started',
      startDate: userModule ? userModule.startDate : null,
      completionDate: userModule ? userModule.completionDate : null,
      lastActivity: userModule ? userModule.lastActivity : null,
    };
  });
};

// Reemplazar el método getUserSubModules en userService.js por esta versión:
exports.getUserSubModules = async (userId, moduleId = null) => {
  // Si se especifica moduleId, obtener los submódulos de ese módulo
  let moduleSubModules = [];
  if (moduleId) {
    const module = await Module.findById(moduleId).populate('subModules');
    if (module && module.subModules) {
      moduleSubModules = module.subModules;
    }
  } else {
    // Si no se especifica moduleId, obtener todos los módulos y sus submódulos
    const modules = await Module.find().populate('subModules');
    moduleSubModules = modules.reduce((acc, module) => {
      return acc.concat(
        module.subModules.map((sm) => ({
          subModule: sm,
          moduleId: module._id,
          moduleTitle: module.title,
          moduleOrder: module.order,
        }))
      );
    }, []);
  }

  // Obtener información de usuario para cada submódulo
  const userSubModules = await UserSubModule.find({
    userId,
    ...(moduleId ? { moduleId } : {}),
  }).lean();

  const userSubModulesMap = {};
  userSubModules.forEach((usm) => {
    userSubModulesMap[usm.subModuleId.toString()] = usm;
  });

  // Combinar información y devolver
  if (moduleId) {
    return moduleSubModules
      .map((sm) => {
        const userSM = userSubModulesMap[sm._id.toString()];
        return {
          id: sm._id,
          title: sm.title,
          order: sm.order,
          content: sm.content,
          moduleId: moduleId,
          status: userSM ? userSM.status : 'not-started',
          startDate: userSM ? userSM.startDate : null,
          completionDate: userSM ? userSM.completionDate : null,
          lastActivity: userSM ? userSM.lastActivity : null,
        };
      })
      .sort((a, b) => a.order - b.order);
  } else {
    return moduleSubModules
      .map(({ subModule, moduleId, moduleTitle, moduleOrder }) => {
        const userSM = userSubModulesMap[subModule._id.toString()];
        return {
          id: subModule._id,
          title: subModule.title,
          order: subModule.order,
          content: subModule.content,
          moduleId: moduleId,
          moduleTitle: moduleTitle,
          moduleOrder: moduleOrder,
          status: userSM ? userSM.status : 'not-started',
          startDate: userSM ? userSM.startDate : null,
          completionDate: userSM ? userSM.completionDate : null,
          lastActivity: userSM ? userSM.lastActivity : null,
        };
      })
      .sort((a, b) =>
        a.moduleOrder !== b.moduleOrder ? a.moduleOrder - b.moduleOrder : a.order - b.order
      );
  }
};

exports.getUserChallenges = async (userId) => {
  const userChallenges = await UserChallenge.find({ userId })
    .populate('challengeId', 'title description level duration content submissionCount')
    .populate('subModuleId', 'title moduleId')
    .populate({
      path: 'bestSolutionId',
      select: 'solution status executionTime submissionDate',
    })
    .sort({ lastActivity: -1 });

  return userChallenges.map((uc) => {
    const challenge = uc.challengeId;
    return {
      id: uc._id,
      challengeId: challenge._id,
      title: challenge.title,
      description: challenge.description,
      level: challenge.level,
      duration: challenge.duration,
      subModuleId: uc.subModuleId ? uc.subModuleId._id : null,
      subModuleTitle: uc.subModuleId ? uc.subModuleId.title : null,
      moduleId: uc.subModuleId ? uc.subModuleId.moduleId : null,
      status: uc.status,
      completed: uc.completed,
      attempts: uc.attempts,
      startDate: uc.startDate,
      completionDate: uc.completionDate,
      lastActivity: uc.lastActivity,
      bestSolution: uc.bestSolutionId
        ? {
            id: uc.bestSolutionId._id,
            solution: uc.bestSolutionId.solution,
            status: uc.bestSolutionId.status,
            executionTime: uc.bestSolutionId.executionTime,
            submissionDate: uc.bestSolutionId.submissionDate,
          }
        : null,
    };
  });
};

exports.getUserSolutions = async (userId, challengeId = null) => {
  let query = { userId };

  if (challengeId) {
    query.challengeId = challengeId;
  }

  const solutions = await ChallengeSolution.find(query)
    .populate('challengeId', 'title level')
    .populate('subModuleId', 'title moduleId')
    .sort({ submissionDate: -1 });

  return solutions.map((s) => ({
    id: s._id,
    challengeId: s.challengeId._id,
    challengeTitle: s.challengeId.title,
    challengeLevel: s.challengeId.level,
    solution: s.solution,
    status: s.status,
    executionTime: s.executionTime,
    submissionDate: s.submissionDate,
    isFavorite: s.isFavorite,
    subModuleId: s.subModuleId ? s.subModuleId._id : null,
    subModuleTitle: s.subModuleId ? s.subModuleId.title : null,
    moduleId: s.subModuleId ? s.subModuleId.moduleId : null,
    testResults: s.testResults,
  }));
};

exports.getUserStatistics = async (userId) => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw error('Usuario no encontrado', 404);
  }

  // Obtener progreso global
  const progress = await UserProgress.findOne({ userId });

  // Obtener actividad de módulos
  const moduleStats = await UserModule.aggregate([
    { $match: { userId: user._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProgress: { $avg: '$progress' },
      },
    },
  ]);

  // Obtener actividad de submódulos
  const subModuleStats = await UserSubModule.aggregate([
    { $match: { userId: user._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Obtener actividad de desafíos
  const challengeStats = await UserChallenge.aggregate([
    { $match: { userId: user._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgAttempts: { $avg: '$attempts' },
      },
    },
  ]);

  // Obtener soluciones
  const solutionStats = await ChallengeSolution.aggregate([
    { $match: { userId: user._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgExecutionTime: { $avg: '$executionTime' },
      },
    },
  ]);

  // Obtener actividad reciente
  const recentActivity = await ActivityLog.find({ userId }).sort({ timestamp: -1 }).limit(10);

  return {
    username: user.username,
    level: user.level,
    lastActivity: user.lastActivity,
    totalProgress: progress ? progress.totalProgress : 0,
    currentStreak: progress ? progress.currentStreak : 0,
    maxStreak: progress ? progress.maxStreak : 0,
    moduleStats: moduleStats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        avgProgress: Math.round(stat.avgProgress || 0),
      };
      return acc;
    }, {}),
    subModuleStats: subModuleStats.reduce((acc, stat) => {
      acc[stat._id] = { count: stat.count };
      return acc;
    }, {}),
    challengeStats: challengeStats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        avgAttempts: Math.round(stat.avgAttempts || 0),
      };
      return acc;
    }, {}),
    solutionStats: solutionStats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        avgExecutionTime: Math.round(stat.avgExecutionTime || 0),
      };
      return acc;
    }, {}),
    recentActivity: recentActivity.map((a) => ({
      id: a._id,
      action: a.action,
      entityType: a.entityType,
      timestamp: a.timestamp,
      details: a.details,
    })),
  };
};

exports.deleteUser = async (userId) => {
  // Eliminar usuario y todos sus datos relacionados
  const user = await User.findById(userId);

  if (!user) {
    throw error('Usuario no encontrado', 404);
  }

  // Eliminar todos los datos relacionados
  await Promise.all([
    UserProgress.deleteMany({ userId }),
    UserModule.deleteMany({ userId }),
    UserSubModule.deleteMany({ userId }),
    UserChallenge.deleteMany({ userId }),
    ChallengeSolution.deleteMany({ userId }),
    ActivityLog.deleteMany({ userId }),
    User.findByIdAndDelete(userId),
  ]);

  return { message: 'Usuario eliminado con éxito' };
};

const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    // Usar regex para extraer el public_id después de 'upload' y la versión (opcional)
    const regex = /\/upload(?:\/v\d+)?\/(.+?)(?:\.[^.]+)?$/;
    const match = url.match(regex);

    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

// Versión mejorada de uploadProfileImage
exports.uploadProfileImage = async (userId, file) => {
  // Verificar si el usuario existe
  const user = await User.findById(userId);

  if (!user) {
    throw error('Usuario no encontrado', 404);
  }

  try {
    // Variable para almacenar el public_id de la imagen anterior
    let oldImagePublicId = null;

    // Comprobar si el usuario ya tiene una imagen de perfil
    if (user.profileImage) {
      oldImagePublicId = getPublicIdFromUrl(user.profileImage);
    }

    // Subir la nueva imagen a Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'profile_images',
          resource_type: 'image',
        },
        async (err, result) => {
          if (err) return reject(err);

          try {
            // Actualizar el perfil del usuario con la URL de la nueva imagen
            const updatedUser = await User.findByIdAndUpdate(
              userId,
              { profileImage: result.secure_url },
              { new: true }
            ).select('-password');

            // Registrar actividad
            await ActivityLog.create({
              userId,
              action: 'profile_image_updated',
              entityType: 'user',
              entityId: userId,
              details: { imageUrl: result.secure_url },
            });

            // Si había una imagen anterior, eliminarla
            if (oldImagePublicId) {
              try {
                await cloudinary.uploader.destroy(oldImagePublicId);
              } catch (deleteErr) {
                console.error('Error al eliminar imagen anterior:', deleteErr);
              }
            }

            resolve(updatedUser);
          } catch (updateErr) {
            // Si hay un error al actualizar el usuario, intentamos eliminar la imagen subida
            if (result && result.public_id) {
              cloudinary.uploader
                .destroy(result.public_id)
                .catch((e) => console.error('Error al limpiar imagen:', e));
            }
            reject(updateErr);
          }
        }
      );

      // Convertir el buffer a stream y dirigirlo a Cloudinary
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  } catch (err) {
    throw error('Error al subir la imagen', 500);
  }
};
