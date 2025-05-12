const SubModule = require('../models/SubModule');
const Module = require('../models/Module');
const UserSubModule = require('../models/UserSubModule');
const UserProgress = require('../models/UserProgress');
const ActivityLog = require('../models/ActivityLog');
const moduleService = require('./moduleService');
const progressService = require('./progressService');
const { error } = require('../utils/responseFormatter');

exports.createSubModule = async (subModuleData) => {
  // Crear el submódulo
  const subModule = await SubModule.create(subModuleData);

  // Actualizar el número total de submódulos para todos los usuarios
  await UserProgress.updateMany({}, { $inc: { totalSubModules: 1 } });

  return subModule;
};

exports.getAllSubModules = async () => {
  const subModules = await SubModule.find().sort({ order: 1 });
  return subModules;
};

exports.getSubModuleById = async (subModuleId, userId = null) => {
  const subModule = await SubModule.findById(subModuleId);

  if (!subModule) {
    throw error('Submódulo no encontrado', 404);
  }

  // Encontrar a qué módulo pertenece este submódulo
  const module = await Module.findOne({ subModules: subModuleId });

  const result = {
    id: subModule._id,
    title: subModule.title,
    order: subModule.order,
    content: subModule.content,
    moduleId: module ? module._id : null,
    moduleTitle: module ? module.title : null,
  };

  // Si hay userId, agregar información específica del usuario
  if (userId) {
    const userSubModule = await UserSubModule.findOne({
      userId,
      subModuleId: subModuleId,
    });

    if (userSubModule) {
      result.status = userSubModule.status;
      result.startDate = userSubModule.startDate;
      result.completionDate = userSubModule.completionDate;
    } else {
      result.status = 'not-started';
    }
  }

  return result;
};

exports.updateSubModule = async (subModuleId, subModuleData) => {
  const subModule = await SubModule.findById(subModuleId);

  if (!subModule) {
    throw error('Submódulo no encontrado', 404);
  }

  // Actualizar el submódulo
  const updatedSubModule = await SubModule.findByIdAndUpdate(
    subModuleId,
    { $set: subModuleData },
    { new: true, runValidators: true }
  );

  return updatedSubModule;
};

exports.deleteSubModule = async (subModuleId) => {
  const subModule = await SubModule.findById(subModuleId);

  if (!subModule) {
    throw error('Submódulo no encontrado', 404);
  }

  // Buscar módulos que referencian este submódulo
  const modulesWithSubModule = await Module.find({ subModules: subModuleId });

  // Eliminar la referencia al submódulo de los módulos
  for (const module of modulesWithSubModule) {
    module.subModules = module.subModules.filter((id) => id.toString() !== subModuleId.toString());
    await module.save();
  }

  // Eliminar submódulo y datos relacionados
  await Promise.all([
    UserSubModule.deleteMany({ subModuleId }),
    SubModule.findByIdAndDelete(subModuleId),
  ]);

  // Actualizar progreso global
  await UserProgress.updateMany({}, { $inc: { totalSubModules: -1 } });

  // Recalcular progreso de los módulos afectados
  for (const module of modulesWithSubModule) {
    await moduleService.calculateModuleProgress(null, module._id);
  }

  return { message: 'Submódulo eliminado con éxito' };
};

exports.startSubModule = async (userId, subModuleId) => {
  // Validar que el submódulo existe
  const subModule = await SubModule.findById(subModuleId);

  if (!subModule) {
    throw error('Submódulo no encontrado', 404);
  }

  // Encontrar a qué módulo pertenece este submódulo
  const module = await Module.findOne({ subModules: subModuleId });

  if (!module) {
    throw error('Este submódulo no está asociado a ningún módulo', 404);
  }

  // Buscar o crear registro de usuario-submódulo
  let userSubModule = await UserSubModule.findOne({ userId, subModuleId });

  if (!userSubModule) {
    userSubModule = new UserSubModule({
      userId,
      subModuleId,
      moduleId: module._id,
      status: 'not-started',
    });
  }

  // Solo actualizar si no está ya iniciado
  if (userSubModule.status === 'not-started') {
    userSubModule.status = 'in-progress';
    userSubModule.startDate = new Date();
    userSubModule.lastActivity = new Date();
    await userSubModule.save();

    // Asegurarse de que el módulo padre también está marcado como en progreso
    await moduleService.startModule(userId, module._id);

    // Registrar actividad
    await ActivityLog.create({
      userId,
      action: 'submodule_started',
      entityType: 'submodule',
      entityId: subModuleId,
      details: {
        subModuleTitle: subModule.title,
        moduleId: module._id,
        moduleTitle: module.title,
      },
    });

    // Actualizar racha
    await progressService.updateUserStreak(userId);
  }

  return userSubModule;
};

exports.completeSubModule = async (userId, subModuleId) => {
  // Validar que el submódulo existe
  const subModule = await SubModule.findById(subModuleId);

  if (!subModule) {
    throw error('Submódulo no encontrado', 404);
  }

  // Encontrar a qué módulo pertenece este submódulo
  const module = await Module.findOne({ subModules: subModuleId });

  if (!module) {
    throw error('Este submódulo no está asociado a ningún módulo', 404);
  }

  // Buscar registro de usuario-submódulo
  let userSubModule = await UserSubModule.findOne({ userId, subModuleId });

  if (!userSubModule) {
    // Crear e iniciar el submódulo primero
    userSubModule = await this.startSubModule(userId, subModuleId);
  }

  // Actualizar estado a completado
  if (userSubModule.status !== 'completed') {
    userSubModule.status = 'completed';
    userSubModule.completionDate = new Date();
    userSubModule.lastActivity = new Date();
    await userSubModule.save();

    // Incrementar contador de submódulos completados
    await UserProgress.findOneAndUpdate(
      { userId },
      {
        $inc: { completedSubModules: 1 },
        $set: { lastUpdated: new Date() },
      },
      { upsert: true }
    );

    // Registrar actividad
    await ActivityLog.create({
      userId,
      action: 'submodule_completed',
      entityType: 'submodule',
      entityId: subModuleId,
      details: {
        subModuleTitle: subModule.title,
        moduleId: module._id,
        moduleTitle: module.title,
      },
    });

    // Actualizar progreso del módulo y general
    await moduleService.calculateModuleProgress(userId, module._id);
    await progressService.calculateTotalProgress(userId);
    await progressService.updateUserStreak(userId);
  }

  return userSubModule;
};
