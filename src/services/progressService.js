const UserProgress = require('../models/UserProgress');
const UserModule = require('../models/UserModule');
const UserSubModule = require('../models/UserSubModule');
const UserChallenge = require('../models/UserChallenge');
const Module = require('../models/Module');
const SubModule = require('../models/SubModule');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const { error } = require('../utils/responseFormatter');

exports.getUserProgress = async (userId) => {
  let progress = await UserProgress.findOne({ userId });

  if (!progress) {
    // Contar totales para inicializar
    const totalModules = await Module.countDocuments();
    const totalSubModules = await SubModule.countDocuments();
    const totalChallenges = await Challenge.countDocuments();

    // Crear progreso inicial
    progress = await UserProgress.create({
      userId,
      totalModules,
      totalSubModules,
      totalChallenges,
      completedModules: 0,
      completedSubModules: 0,
      completedChallenges: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalProgress: 0,
    });
  }

  return progress;
};

exports.calculateTotalProgress = async (userId) => {
  // Obtener totales actuales
  const totalModules = await Module.countDocuments();
  const totalSubModules = await SubModule.countDocuments();
  const totalChallenges = await Challenge.countDocuments();

  // No calcular si no hay contenido
  if (totalModules === 0 && totalSubModules === 0 && totalChallenges === 0) {
    return { totalProgress: 0 };
  }

  // Contar completados
  const completedModules = await UserModule.countDocuments({
    userId,
    status: 'completed',
  });

  const completedSubModules = await UserSubModule.countDocuments({
    userId,
    status: 'completed',
  });

  const completedChallenges = await UserChallenge.countDocuments({
    userId,
    completed: true,
  });

  // Calcular progreso total (dar peso a cada tipo de contenido)
  let moduleWeight = 0.4;
  let subModuleWeight = 0.4;
  let challengeWeight = 0.2;

  let moduleProgress = totalModules > 0 ? (completedModules / totalModules) * moduleWeight : 0;
  let subModuleProgress =
    totalSubModules > 0 ? (completedSubModules / totalSubModules) * subModuleWeight : 0;
  let challengeProgress =
    totalChallenges > 0 ? (completedChallenges / totalChallenges) * challengeWeight : 0;

  // Si falta algún tipo de contenido, ajustar los pesos
  if (totalModules === 0) {
    subModuleWeight = 0.6;
    challengeWeight = 0.4;
    subModuleProgress =
      totalSubModules > 0 ? (completedSubModules / totalSubModules) * subModuleWeight : 0;
    challengeProgress =
      totalChallenges > 0 ? (completedChallenges / totalChallenges) * challengeWeight : 0;
  } else if (totalSubModules === 0) {
    moduleWeight = 0.6;
    challengeWeight = 0.4;
    moduleProgress = totalModules > 0 ? (completedModules / totalModules) * moduleWeight : 0;
    challengeProgress =
      totalChallenges > 0 ? (completedChallenges / totalChallenges) * challengeWeight : 0;
  } else if (totalChallenges === 0) {
    moduleWeight = 0.5;
    subModuleWeight = 0.5;
    moduleProgress = totalModules > 0 ? (completedModules / totalModules) * moduleWeight : 0;
    subModuleProgress =
      totalSubModules > 0 ? (completedSubModules / totalSubModules) * subModuleWeight : 0;
  }

  const totalProgress = Math.round((moduleProgress + subModuleProgress + challengeProgress) * 100);

  // Actualizar progreso en la base de datos
  await UserProgress.findOneAndUpdate(
    { userId },
    {
      $set: {
        totalProgress,
        completedModules,
        totalModules,
        completedSubModules,
        totalSubModules,
        completedChallenges,
        totalChallenges,
        lastUpdated: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  // Actualizar nivel del usuario basado en el progreso
  await this.updateUserLevel(userId, totalProgress);

  return {
    totalProgress,
    completedModules,
    totalModules,
    completedSubModules,
    totalSubModules,
    completedChallenges,
    totalChallenges,
  };
};

exports.updateUserStreak = async (userId) => {
  // Buscar o crear progreso
  let progress = await UserProgress.findOne({ userId });

  if (!progress) {
    progress = await this.getUserProgress(userId);
  }

  const today = new Date();
  const lastUpdate = new Date(progress.lastStreakUpdate);

  // Verificar si la actividad fue hoy
  if (today.toDateString() === lastUpdate.toDateString()) {
    // Ya ha habido actividad hoy, no cambiar la racha
    return {
      currentStreak: progress.currentStreak,
      maxStreak: progress.maxStreak,
    };
  }

  // Verificar si la actividad fue ayer (mantener racha)
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (today - lastUpdate <= oneDayMs) {
    progress.currentStreak += 1;

    if (progress.currentStreak > progress.maxStreak) {
      progress.maxStreak = progress.currentStreak;
    }
  } else {
    // Si ha pasado más de un día, reiniciar racha
    progress.currentStreak = 1;
  }

  progress.lastStreakUpdate = today;
  await progress.save();

  // Actualizar nivel del usuario basado en la racha
  await this.updateUserLevel(userId);

  return {
    currentStreak: progress.currentStreak,
    maxStreak: progress.maxStreak,
  };
};

exports.updateUserLevel = async (userId, totalProgress = null) => {
  const user = await User.findById(userId);

  if (!user) {
    throw error('Usuario no encontrado', 404);
  }

  const progress =
    totalProgress !== null ? { totalProgress } : await UserProgress.findOne({ userId });

  if (!progress) {
    return user.level;
  }

  // Determinar nivel basado en progreso y racha
  let newLevel = 'Beginner';

  if (progress.totalProgress >= 75 || progress.maxStreak >= 30) {
    newLevel = 'Expert';
  } else if (progress.totalProgress >= 50 || progress.maxStreak >= 15) {
    newLevel = 'Advanced';
  } else if (progress.totalProgress >= 25 || progress.maxStreak >= 7) {
    newLevel = 'Intermediate';
  }

  // Actualizar nivel si cambió
  if (user.level !== newLevel) {
    user.level = newLevel;
    await user.save();
  }

  return newLevel;
};

exports.getNextContent = async (userId) => {
  // Buscar módulos no completados o en progreso
  const inProgressModules = await UserModule.find({
    userId,
    status: 'in-progress',
  })
    .populate('moduleId')
    .sort({ 'moduleId.order': 1 });

  // Si hay módulos en progreso, buscar submódulos no completados
  if (inProgressModules.length > 0) {
    const moduleId = inProgressModules[0].moduleId._id;

    // Buscar submódulos no completados en ese módulo
    const subModules = await SubModule.find({ moduleId }).sort({ order: 1 });
    const userSubModules = await UserSubModule.find({
      userId,
      moduleId,
    });

    // Crear un mapa de submódulos del usuario para facilitar búsqueda
    const userSubModuleMap = {};
    userSubModules.forEach((usm) => {
      userSubModuleMap[usm.subModuleId.toString()] = usm;
    });

    // Buscar el primer submódulo no completado
    for (const subModule of subModules) {
      const userSubModule = userSubModuleMap[subModule._id.toString()];

      if (!userSubModule || userSubModule.status !== 'completed') {
        // Encontramos el próximo submódulo a completar
        return {
          type: 'submodule',
          id: subModule._id,
          title: subModule.title,
          moduleId: moduleId,
          moduleTitle: inProgressModules[0].moduleId.title,
          status: userSubModule ? userSubModule.status : 'not-started',
          hasChallenge: subModule.hasChallenge,
          challengeId: subModule.challengeId,
        };
      }
    }
  }

  // Si no hay módulos en progreso o todos los submódulos están completados,
  // buscar el primer módulo no iniciado
  const modules = await Module.find().sort({ order: 1 });
  const userModules = await UserModule.find({ userId });

  // Crear un mapa de módulos del usuario para facilitar búsqueda
  const userModuleMap = {};
  userModules.forEach((um) => {
    userModuleMap[um.moduleId.toString()] = um;
  });

  // Buscar el primer módulo no iniciado o no completado
  for (const module of modules) {
    const userModule = userModuleMap[module._id.toString()];

    if (!userModule || userModule.status !== 'completed') {
      // Encontramos el próximo módulo a iniciar/completar
      return {
        type: 'module',
        id: module._id,
        title: module.title,
        description: module.description,
        level: module.level,
        order: module.order,
        status: userModule ? userModule.status : 'not-started',
      };
    }
  }

  // Si todos los módulos están completados
  return {
    type: 'complete',
    message: 'Has completado todo el contenido disponible',
    progress: await this.getUserProgress(userId),
  };
};
