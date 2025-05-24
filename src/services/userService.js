const { error } = require('../utils/responseFormatter');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');
const streamifier = require('streamifier');

const ModuleService = require('./moduleService');

const User = require('../models/User');

const bcrypt = require('bcryptjs');

exports.updateUser = async (userId, userData) => {
  if (userData.password) {
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
  }

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

  const globalProgress = Math.round((completados / modules.length) * 100);

  let level = 'Principiante';
  if (globalProgress >= 70) {
    level = 'Avanzado';
  } else if (globalProgress >= 35) {
    level = 'Intermedio';
  }

  return await this.updateUser(user, { globalProgress, level });
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

exports.deleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw error('Usuario no encontrado', 404);
  }

  // Eliminar todos los datos relacionados
  await Promise.all([User.findByIdAndDelete(userId)]);

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

exports.updateUserStreak = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw error('Usuario no encontrado', 404);
  }

  const lastActivityDate = new Date(user.lastActivity);
  const currentDate = new Date();

  const lastActivityDay = new Date(
    lastActivityDate.getFullYear(),
    lastActivityDate.getMonth(),
    lastActivityDate.getDate()
  );

  const currentDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );

  const diffTime = currentDay.getTime() - lastActivityDay.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let newStreak = user.streak;

  // Si la última actividad fue exactamente ayer, incrementar streak
  if (diffDays === 1) {
    newStreak += 1;
  }
  // Si pasó más de un día y el streak no es 0, resetear a 0
  else if (diffDays > 1 && user.streak > 0) {
    newStreak = 0;
  }

  // Actualizar el usuario con el nuevo streak y la fecha de última actividad
  return await this.updateUser(userId, {
    streak: newStreak,
    lastActivity: currentDate,
  });
};

exports.addPointsToUser = async (userId, points) => {
  return await User.findByIdAndUpdate(userId, { $inc: { points } });
};
