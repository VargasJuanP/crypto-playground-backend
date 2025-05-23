const Module = require('../models/Module');
const UserModule = require('../models/UserModule');

const SubModuleService = require('./submoduleService');
const UserService = require('./userService');

exports.createModule = async (moduleData) => {
  return await Module.create(moduleData);
};

exports.getModules = async () => {
  return await Module.find().sort({ place: 1 });
};

exports.getUserModules = async (user) => {
  return await UserModule.find({ user });
};

exports.getModuleById = async (module) => {
  return await Module.findById(module);
};

exports.getUserModuleById = async (user, module) => {
  return await UserModule.findOne({ user, module });
};

exports.getModuleByPlace = async (place) => {
  return await Module.findOne({ place });
};

exports.updateModule = async (module, moduleData) => {
  return await Module.findByIdAndUpdate(
    module,
    { $set: moduleData },
    { new: true, runValidators: true }
  );
};

exports.updateUserModule = async (user, module, UserModuleData) => {
  return await UserModule.findOneAndUpdate(
    { user, module },
    { $set: UserModuleData },
    { new: true, runValidators: true }
  );
};

exports.createUserModulesForUser = async (user) => {
  const modules = await this.getModules();

  const userModulesData = modules.map((module) => ({
    user,
    module: module._id,
  }));

  // Se desbloquea el primer modulo
  if (userModulesData.length > 0) {
    userModulesData[0].status = 'no-iniciado';
  }

  return await UserModule.insertMany(userModulesData);
};

exports.startModule = async (user, module) => {
  let userModule = await UserModule.findOne({ user, module });

  if (userModule.status === 'no-iniciado') {
    userModule.status = 'en-progreso';

    userModule = await userModule.save();

    // Crear los registros del usuario
    SubModuleService.createUserSubModulesForModule(user, module);
  }

  return userModule;
};

exports.unlockNextModule = async (userId, module) => {
  const nextModule = await this.getModuleByPlace(module.place + 1);

  if (nextModule) {
    const nextUserModule = await this.getUserModuleById(userId, nextModule._id);

    nextUserModule.status = 'no-iniciado';

    await nextUserModule.save();
  }
};

exports.completeModule = async (user, module) => {
  let userModule = await this.startModule(user, module);

  // Si no se ha terminado se actualiza
  if (userModule.status !== 'completado') {
    // Completar los submodulos sin completar
    await SubModuleService.completeSubModulesFromModule(user, module);

    const currentModule = await this.getModuleById(module);

    // Agregar logro
    await UserService.addAchievement(user, currentModule.achievement);

    // Desbloquear siguiente modulo
    await this.unlockNextModule(user, currentModule);

    // Completar el modulo actual
    userModule.status = 'completado';
    userModule.progress = 100;
    userModule = await userModule.save();

    // Actualizar el progreso global
    await UserService.updateGlobalProgress(user);

    // Actualizar racha
    await UserService.updateUserStreak(user);
  }

  return userModule;
};

exports.updateModuleProgress = async (user, module) => {
  const subModules = await SubModuleService.getUserSubModulesByModuleId(user, module);

  const completados = subModules.filter((sm) => sm.status === 'completado').length;

  return await this.updateUserModule(user, module, {
    progress: Math.round((completados / subModules.length) * 100),
  });
};
