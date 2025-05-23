const { error } = require('../utils/responseFormatter');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');
const streamifier = require('streamifier');

const ModuleService = require('./moduleService');

const User = require('../models/User');
const UserChallenge = require('../models/UserChallenge');
const UserSubModule = require('../models/UserSubModule');

exports.updateUser = async (userId, userData) => {
  return await User.findByIdAndUpdate(
    userId,
    { $set: userData },
    { new: true, runValidators: true }
  ).select('-password');
};

exports.getUserById = async (userId) => {
  return await User.findById(userId).select('-password');
};

exports.addAchievement = async (userId, achievement) => {
  const user = await this.getUserById(userId);

  user.achievements.push(achievement);

  return await user.save();
};

exports.updateGlobalProgress = async (user) => {
  const modules = await ModuleService.getUserModules(user);

  const completados = modules.filter((m) => m.status === 'completado').length;

  return await this.updateUser(user, { globalProgress: Math.round((completados / modules.length) * 100) });
};

exports.getUserModules = async (user) => {
  const modules = await ModuleService.getModules();
  const userModules = await ModuleService.getUserModules(user);

  const userModulesMap = {};
  userModules.forEach((userModule) => {
    userModulesMap[userModule.module.toString()] = userModule;
  });

  const combinedModules = modules.map((module) => {
    const moduleId = module._id.toString();
    const userModule = userModulesMap[moduleId];

    return {
      id: module._id,
      title: module.title,
      description: module.description,
      duration: module.duration,
      place: module.place,
      level: module.level,
      status: userModule.status,
      progress: userModule.progress,
    };
  });

  return combinedModules;
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

exports.deleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw error('Usuario no encontrado', 404);
  }

  // Eliminar todos los datos relacionados
  await Promise.all([
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
