const userService = require('../services/userService');
const { validationResult } = require('express-validator');
const { success } = require('../utils/responseFormatter');

exports.getAllUsers = async (req, res, next) => {
  try {
    // Solo admins pueden ver todos los usuarios
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
    const userId = req.params.id || req.user.id;

    // Verificar si el usuario actual puede acceder a este perfil
    if (req.params.id && req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para ver este perfil' });
    }

    const profile = await userService.getUserProfile(userId);
    res.json(success(profile, 'Perfil de usuario obtenido con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    // Validar inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.id || req.user.id;

    // Verificar si el usuario actual puede actualizar este perfil
    if (req.params.id && req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para actualizar este perfil' });
    }

    const isAdmin = req.user.role === 'admin';
    const updatedUser = await userService.updateUserProfile(userId, req.body, isAdmin);

    res.json(success(updatedUser, 'Perfil actualizado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getUserModules = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id;

    // Verificar si el usuario actual puede acceder a estos módulos
    if (req.params.id && req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para ver estos módulos' });
    }

    const modules = await userService.getUserModules(userId);
    res.json(success(modules, 'Módulos del usuario obtenidos con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getUserSubModules = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id;
    const moduleId = req.query.moduleId || null;

    // Verificar si el usuario actual puede acceder a estos submódulos
    if (req.params.id && req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para ver estos submódulos' });
    }

    const subModules = await userService.getUserSubModules(userId, moduleId);
    res.json(success(subModules, 'Submódulos del usuario obtenidos con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getUserChallenges = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id;

    // Verificar si el usuario actual puede acceder a estos desafíos
    if (req.params.id && req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para ver estos desafíos' });
    }

    const challenges = await userService.getUserChallenges(userId);
    res.json(success(challenges, 'Desafíos del usuario obtenidos con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getUserSolutions = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id;
    const challengeId = req.query.challengeId || null;

    // Verificar si el usuario actual puede acceder a estas soluciones
    if (req.params.id && req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para ver estas soluciones' });
    }

    const solutions = await userService.getUserSolutions(userId, challengeId);
    res.json(success(solutions, 'Soluciones del usuario obtenidas con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getUserStatistics = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id;

    // Verificar si el usuario actual puede acceder a estas estadísticas
    if (req.params.id && req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para ver estas estadísticas' });
    }

    const stats = await userService.getUserStatistics(userId);
    res.json(success(stats, 'Estadísticas del usuario obtenidas con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

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
