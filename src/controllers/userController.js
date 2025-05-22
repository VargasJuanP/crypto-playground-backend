const userService = require('../services/userService');
const { validationResult } = require('express-validator');
const { success } = require('../utils/responseFormatter');

exports.updateUserProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updatedUser = await userService.updateUser(req.user.id, req.body);

    res.json(success(updatedUser, 'Perfil actualizado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await userService.getAllUsers(page, limit);

    res.json(success(result, 'Usuarios obtenidos con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getUserProfile = async (req, res, next) => {
  try {
    const profile = await userService.getUserProfile(req.user.id);

    res.json(success(profile, 'Perfil de usuario obtenido con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getUserModules = async (req, res, next) => {
  try {
    const modules = await userService.getUserModules(req.user.id);

    res.json(success(modules, 'Módulos del usuario obtenidos con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getUserSubModules = async (req, res, next) => {
  try {
    const subModules = await userService.getUserSubModules(req.user.id);

    res.json(success(subModules, 'Submódulos del usuario obtenidos con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id;

    // Solo admins pueden eliminar cualquier usuario
    // Los usuarios normales solo pueden eliminar su propia cuenta
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este usuario' });
    }

    const result = await userService.deleteUser(userId);
    res.json(success(null, result.message));
  } catch (err) {
    next(err);
  }
};

exports.uploadProfileImage = async (req, res, next) => {
  try {
    // Verificar si hay un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen',
      });
    }

    const userId = req.params.id || req.user.id;

    // Verificar si el usuario actual puede actualizar este perfil
    if (req.params.id && req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar este perfil',
      });
    }

    const updatedUser = await userService.uploadProfileImage(userId, req.file);

    res.json(success(updatedUser, 'Imagen de perfil actualizada con éxito'));
  } catch (err) {
    next(err);
  }
};
