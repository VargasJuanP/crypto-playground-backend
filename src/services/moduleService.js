const Module = require('../models/Module');
const SubModule = require('../models/SubModule');
const Challenge = require('../models/Challenge');
const UserSubModule = require('../models/UserSubModule');
const UserModule = require('../models/UserModule');
const UserChallenge = require('../models/UserChallenge');
const UserProgress = require('../models/UserProgress');
const ActivityLog = require('../models/ActivityLog');
const { error } = require('../utils/responseFormatter');
const progressService = require('./progressService');

exports.getAllModules = async (userId = null) => {
  const modules = await Module.find().sort({ order: 1 });

  // Si hay userId, obtener el progreso de cada módulo para el usuario
  if (userId) {
    const userModules = await UserModule.find({ userId }).lean();
    const userModulesMap = {};

    userModules.forEach((um) => {
      userModulesMap[um.moduleId.toString()] = um;
    });

    return modules.map((module) => {
      const userModule = userModulesMap[module._id.toString()];
      return {
        id: module._id,
        title: module.title,
        description: module.description,
        level: module.level,
        duration: module.duration,
        order: module.order,
        subModulesCount: module.subModules.length,
        hasChallenge: !!module.challengeId,
        progress: userModule ? userModule.progress : 0,
        status: userModule ? userModule.status : 'not-started',
      };
    });
  }

  return modules.map((module) => ({
    id: module._id,
    title: module.title,
    description: module.description,
    level: module.level,
    duration: module.duration,
    order: module.order,
    subModulesCount: module.subModules.length,
    hasChallenge: !!module.challengeId,
  }));
};

exports.getModuleById = async (moduleId, userId = null) => {
  const module = await Module.findById(moduleId).populate('subModules').populate('challengeId');

  if (!module) {
    throw error('Módulo no encontrado', 404);
  }

  const result = {
    id: module._id,
    title: module.title,
    description: module.description,
    level: module.level,
    duration: module.duration,
    order: module.order,
    subModules: module.subModules.map((sub) => ({
      id: sub._id,
      title: sub.title,
      order: sub.order,
    })),
  };

  // Añadir información del desafío si existe
  if (module.challengeId) {
    result.challenge = {
      id: module.challengeId._id,
      title: module.challengeId.title,
      description: module.challengeId.description,
      level: module.challengeId.level,
    };
  }

  // Si hay userId, agregar información específica del usuario
  if (userId) {
    const userModule = await UserModule.findOne({ userId, moduleId });

    if (userModule) {
      result.progress = userModule.progress;
      result.status = userModule.status;
      result.startDate = userModule.startDate;
      result.completionDate = userModule.completionDate;
    } else {
      result.progress = 0;
      result.status = 'not-started';
    }

    // Añadir el progreso de cada submódulo
    if (module.subModules && module.subModules.length > 0) {
      const subModuleIds = module.subModules.map((sm) => sm._id);
      const userSubModules = await UserSubModule.find({
        userId,
        subModuleId: { $in: subModuleIds },
      });

      const userSubModuleMap = {};
      userSubModules.forEach((usm) => {
        userSubModuleMap[usm.subModuleId.toString()] = usm;
      });

      result.subModules = result.subModules.map((sm) => {
        const userSM = userSubModuleMap[sm.id.toString()];
        return {
          ...sm,
          status: userSM ? userSM.status : 'not-started',
          startDate: userSM ? userSM.startDate : null,
          completionDate: userSM ? userSM.completionDate : null,
        };
      });
    }

    // Añadir el progreso del desafío si existe
    if (module.challengeId) {
      const userChallenge = await UserChallenge.findOne({
        userId,
        challengeId: module.challengeId._id,
      });

      if (userChallenge) {
        result.challenge.status = userChallenge.status;
        result.challenge.completed = userChallenge.completed;
        result.challenge.attempts = userChallenge.attempts;
      } else {
        result.challenge.status = 'not-started';
        result.challenge.completed = false;
        result.challenge.attempts = 0;
      }
    }
  }

  return result;
};

exports.createModule = async (moduleData) => {
  // Verificar si ya existe un módulo con ese orden
  const existingModule = await Module.findOne({ order: moduleData.order });
  if (existingModule) {
    throw error(`Ya existe un módulo con el orden ${moduleData.order}`, 400);
  }

  // Verificar si el challengeId existe (si se proporciona)
  if (moduleData.challengeId) {
    const challenge = await Challenge.findById(moduleData.challengeId);
    if (!challenge) {
      throw error('El desafío especificado no existe', 404);
    }
  }

  // Verificar que los subModules existen (si se proporcionan)
  if (moduleData.subModules && moduleData.subModules.length > 0) {
    const subModulesCount = await SubModule.countDocuments({
      _id: { $in: moduleData.subModules },
    });

    if (subModulesCount !== moduleData.subModules.length) {
      throw error('Uno o más submódulos especificados no existen', 404);
    }
  }

  const module = await Module.create(moduleData);

  // Actualizar el número total de módulos para todos los usuarios
  await UserProgress.updateMany({}, { $inc: { totalModules: 1 } });

  return module;
};

exports.updateModule = async (moduleId, moduleData) => {
  // Si estamos actualizando el orden, verificar que no exista otro con ese orden
  if (moduleData.order) {
    const existingModule = await Module.findOne({
      order: moduleData.order,
      _id: { $ne: moduleId },
    });

    if (existingModule) {
      throw error(`Ya existe un módulo con el orden ${moduleData.order}`, 400);
    }
  }

  // Verificar si el challengeId existe (si se proporciona)
  if (moduleData.challengeId) {
    const challenge = await Challenge.findById(moduleData.challengeId);
    if (!challenge) {
      throw error('El desafío especificado no existe', 404);
    }
  }

  // Verificar que los subModules existen (si se proporcionan)
  if (moduleData.subModules && moduleData.subModules.length > 0) {
    const subModulesCount = await SubModule.countDocuments({
      _id: { $in: moduleData.subModules },
    });

    if (subModulesCount !== moduleData.subModules.length) {
      throw error('Uno o más submódulos especificados no existen', 404);
    }
  }

  const module = await Module.findByIdAndUpdate(
    moduleId,
    { $set: moduleData },
    { new: true, runValidators: true }
  );

  if (!module) {
    throw error('Módulo no encontrado', 404);
  }

  return module;
};

exports.deleteModule = async (moduleId) => {
  const module = await Module.findById(moduleId);

  if (!module) {
    throw error('Módulo no encontrado', 404);
  }

  // No se eliminarán los submódulos asociados, solo la referencia

  // Eliminar módulo y datos relacionados de usuarios
  await Promise.all([UserModule.deleteMany({ moduleId }), Module.findByIdAndDelete(moduleId)]);

  // Actualizar progreso global
  await UserProgress.updateMany({}, { $inc: { totalModules: -1 } });

  return { message: 'Módulo eliminado con éxito' };
};

exports.startModule = async (userId, moduleId) => {
  // Validar que el módulo existe
  const module = await Module.findById(moduleId);
  if (!module) {
    throw error('Módulo no encontrado', 404);
  }

  // Buscar o crear registro de usuario-módulo
  let userModule = await UserModule.findOne({ userId, moduleId });

  if (!userModule) {
    userModule = new UserModule({
      userId,
      moduleId,
      progress: 0,
      status: 'not-started',
    });
  }

  // Solo actualizar si no está ya iniciado
  if (userModule.status === 'not-started') {
    userModule.status = 'in-progress';
    userModule.startDate = new Date();
    userModule.lastActivity = new Date();
    await userModule.save();

    // Registrar actividad
    await ActivityLog.create({
      userId,
      action: 'module_started',
      entityType: 'module',
      entityId: moduleId,
      details: { moduleTitle: module.title },
    });

    // Actualizar racha
    await progressService.updateUserStreak(userId);
  }

  return userModule;
};

exports.completeModule = async (userId, moduleId) => {
  // Validar que el módulo existe
  const module = await Module.findById(moduleId).populate('subModules');
  if (!module) {
    throw error('Módulo no encontrado', 404);
  }

  // Buscar registro de usuario-módulo
  let userModule = await UserModule.findOne({ userId, moduleId });

  if (!userModule) {
    throw error('Primero debes iniciar este módulo', 400);
  }

  // Verificar que todos los submódulos estén completados
  if (module.subModules && module.subModules.length > 0) {
    const subModuleIds = module.subModules.map((sm) => sm._id);
    const completedSubModules = await UserSubModule.countDocuments({
      userId,
      subModuleId: { $in: subModuleIds },
      status: 'completed',
    });

    if (completedSubModules < module.subModules.length) {
      throw error('Debes completar todos los submódulos primero', 400);
    }
  }

  // Verificar que el desafío del módulo esté completado (si existe)
  if (module.challengeId) {
    const userChallenge = await UserChallenge.findOne({
      userId,
      challengeId: module.challengeId,
    });

    if (!userChallenge || !userChallenge.completed) {
      throw error('Debes completar el desafío del módulo primero', 400);
    }
  }

  // Actualizar estado a completado
  if (userModule.status !== 'completed') {
    userModule.status = 'completed';
    userModule.progress = 100;
    userModule.completionDate = new Date();
    userModule.lastActivity = new Date();
    await userModule.save();

    // Incrementar contador de módulos completados
    await UserProgress.findOneAndUpdate(
      { userId },
      {
        $inc: { completedModules: 1 },
        $set: { lastUpdated: new Date() },
      },
      { upsert: true }
    );

    // Registrar actividad
    await ActivityLog.create({
      userId,
      action: 'module_completed',
      entityType: 'module',
      entityId: moduleId,
      details: { moduleTitle: module.title },
    });

    // Actualizar progreso general y racha
    await progressService.calculateTotalProgress(userId);
    await progressService.updateUserStreak(userId);
  }

  return userModule;
};

// Calcular automáticamente el progreso de un módulo basado en los submódulos y desafío completados
exports.calculateModuleProgress = async (userId, moduleId) => {
  const module = await Module.findById(moduleId).populate('subModules');

  if (!module) {
    throw error('Módulo no encontrado', 404);
  }

  let totalItems = 0;
  let completedItems = 0;

  // Contar los submódulos completados
  if (module.subModules && module.subModules.length > 0) {
    totalItems += module.subModules.length;

    const subModuleIds = module.subModules.map((sm) => sm._id);
    const completedSubModules = await UserSubModule.countDocuments({
      userId,
      subModuleId: { $in: subModuleIds },
      status: 'completed',
    });

    completedItems += completedSubModules;
  }

  // Contar si el desafío está completado (si existe)
  if (module.challengeId) {
    totalItems += 1;

    const userChallenge = await UserChallenge.findOne({
      userId,
      challengeId: module.challengeId,
      completed: true,
    });

    if (userChallenge) {
      completedItems += 1;
    }
  }

  // Calcular progreso
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Determinar estado
  let status = 'not-started';
  if (progress === 100) {
    status = 'completed';
  } else if (progress > 0) {
    status = 'in-progress';
  }

  // Actualizar UserModule
  await UserModule.findOneAndUpdate(
    { userId, moduleId },
    {
      $set: {
        progress,
        status,
        completionDate: status === 'completed' ? new Date() : null,
        lastActivity: new Date(),
      },
    },
    { upsert: true }
  );

  // Si se completó todo, ejecutar completeModule
  if (status === 'completed') {
    await this.completeModule(userId, moduleId);
  }

  return progress;
};

// Añadir este nuevo método al moduleService.js
exports.getCompleteModule = async (moduleId, userId = null) => {
  const module = await Module.findById(moduleId).populate('subModules').populate('challengeId');

  if (!module) {
    throw error('Módulo no encontrado', 404);
  }

  // Construir el objeto de respuesta base
  const result = {
    id: module._id,
    title: module.title,
    description: module.description,
    level: module.level,
    duration: module.duration,
    order: module.order,
    subModules: [],
    hasChallenge: !!module.challengeId,
  };

  // Añadir información del desafío si existe
  if (module.challengeId) {
    result.challenge = {
      id: module.challengeId._id,
      title: module.challengeId.title,
      description: module.challengeId.description,
      level: module.challengeId.level,
      duration: module.challengeId.duration,
      content: module.challengeId.content,
      validationCriteria: module.challengeId.validationCriteria,
      testCases: module.challengeId.testCases,
    };

    // Si hay userId, añadir información del usuario para el desafío
    if (userId) {
      const userChallenge = await UserChallenge.findOne({
        userId,
        challengeId: module.challengeId._id,
      });

      if (userChallenge) {
        result.challenge.status = userChallenge.status;
        result.challenge.completed = userChallenge.completed;
        result.challenge.attempts = userChallenge.attempts;
        result.challenge.startDate = userChallenge.startDate;
        result.challenge.completionDate = userChallenge.completionDate;

        // Obtener la mejor solución si existe
        if (userChallenge.bestSolutionId) {
          const bestSolution = await ChallengeSolution.findById(userChallenge.bestSolutionId);
          if (bestSolution) {
            result.challenge.bestSolution = {
              id: bestSolution._id,
              solution: bestSolution.solution,
              status: bestSolution.status,
              executionTime: bestSolution.executionTime,
              submissionDate: bestSolution.submissionDate,
            };
          }
        }
      } else {
        result.challenge.status = 'not-started';
        result.challenge.completed = false;
        result.challenge.attempts = 0;
      }
    }
  }

  // Si hay userId, agregar información general del usuario para el módulo
  if (userId) {
    const userModule = await UserModule.findOne({ userId, moduleId });

    if (userModule) {
      result.progress = userModule.progress;
      result.status = userModule.status;
      result.startDate = userModule.startDate;
      result.completionDate = userModule.completionDate;
      result.lastActivity = userModule.lastActivity;
    } else {
      result.progress = 0;
      result.status = 'not-started';
    }
  }

  // Obtener información detallada de cada submódulo
  if (module.subModules && module.subModules.length > 0) {
    // Preparar submódulos con información básica
    const subModuleDetails = await Promise.all(
      module.subModules.map(async (subModule) => {
        const subModuleDetail = {
          id: subModule._id,
          title: subModule.title,
          order: subModule.order,
          content: subModule.content,
        };

        // Añadir información del usuario para este submódulo si existe userId
        if (userId) {
          const userSubModule = await UserSubModule.findOne({
            userId,
            subModuleId: subModule._id,
          });

          if (userSubModule) {
            subModuleDetail.status = userSubModule.status;
            subModuleDetail.startDate = userSubModule.startDate;
            subModuleDetail.completionDate = userSubModule.completionDate;
            subModuleDetail.lastActivity = userSubModule.lastActivity;
          } else {
            subModuleDetail.status = 'not-started';
          }
        }

        return subModuleDetail;
      })
    );

    // Ordenar submódulos por orden
    result.subModules = subModuleDetails.sort((a, b) => a.order - b.order);
  }

  return result;
};
