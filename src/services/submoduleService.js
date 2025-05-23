const UserSubModule = require('../models/UserSubModule');
const SubModule = require('../models/SubModule');

const ModuleService = require('./moduleService');
const UserService = require('./userService');

exports.createSubModule = async (subModuleData) => {
  return await SubModule.create(subModuleData);
};

exports.updateSubModule = async (subModule, subModuleData) => {
  return await SubModule.findByIdAndUpdate(
    subModule,
    { $set: subModuleData },
    { new: true, runValidators: true }
  );
};

exports.getSubModulesByModuleId = async (module) => {
  return await SubModule.find({ module });
};

exports.createUserSubModulesForModule = async (user, module) => {
  const subModules = await this.getSubModulesByModuleId(module);

  const userSubModulesData = subModules.map((subModule) => ({
    user,
    subModule: subModule._id,
  }));

  return await UserSubModule.insertMany(userSubModulesData);
};

exports.startSubModule = async (user, subModule) => {
  let userSubModule = await UserSubModule.findOne({ user, subModule });

  if (userSubModule.status === 'no-iniciado') {
    userSubModule.status = 'en-progreso';
    userSubModule = await userSubModule.save();
  }

  return userSubModule;
};

exports.completeSubModule = async (user, subModule) => {
  let userSubModule = await UserSubModule.findOne({ user, subModule });

  // Se actualiza si no se ha completado
  if (userSubModule.status !== 'completado') {
    userSubModule.status = 'completado';
    userSubModule = await userSubModule.save();

    const module = (await SubModule.findById(subModule)).module;

    // Actualizar progreso del modulo
    await ModuleService.updateModuleProgress(user, module);

    // Actualizar racha
    await UserService.updateUserStreak(user);
  }

  return userSubModule;
};

exports.getUserSubModulesByModuleId = async (user, module) => {
  const subModules = await this.getSubModulesByModuleId(module);

  return await UserSubModule.find({ user, subModule: { $in: subModules.map((sm) => sm._id) } });
};

exports.getFullSubModulesByModuleId = async (user, module) => {
  const userSubModules = await this.getUserSubModulesByModuleId(user, module);
  const subModules = await this.getSubModulesByModuleId(module);

  const userSubModulesMap = {};
  userSubModules.forEach((userSubModule) => {
    userSubModulesMap[userSubModule.subModule.toString()] = userSubModule;
  });

  const combinedSubModules = subModules.map((subModule) => {
    const subModuleId = subModule._id.toString();
    const userSubModule = userSubModulesMap[subModuleId];

    return {
      id: subModule._id,
      module: subModule.module,
      title: subModule.title,
      place: subModule.place,
      status: userSubModule.status,
    };
  });

  return combinedSubModules;
};

exports.completeSubModulesFromModule = async (user, module) => {
  const userSubModules = await this.getUserSubModulesByModuleId(user, module);

  return await UserSubModule.updateMany(
    {
      user,
      subModule: { $in: userSubModules.map((usm) => usm.subModule) },
      status: { $ne: 'completado' },
    },
    { $set: { status: 'completado' } }
  );
};
