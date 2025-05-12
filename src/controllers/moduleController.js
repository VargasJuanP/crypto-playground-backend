const moduleService = require('../services/moduleService');
const { validationResult } = require('express-validator');
const { success } = require('../utils/responseFormatter');

exports.getAllModules = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const modules = await moduleService.getAllModules(userId);
    res.json(success(modules, 'Módulos obtenidos con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getModuleById = async (req, res, next) => {
  try {
    const moduleId = req.params.id;
    const userId = req.user ? req.user.id : null;

    const module = await moduleService.getModuleById(moduleId, userId);
    res.json(success(module, 'Módulo obtenido con éxito'));
  } catch (err) {
    next(err);
  }
};

// Nuevo endpoint para obtener un módulo completo con todos sus submódulos y progreso
exports.getCompleteModule = async (req, res, next) => {
  try {
    const moduleId = req.params.id;
    const userId = req.user ? req.user.id : null;

    const module = await moduleService.getCompleteModule(moduleId, userId);
    res.json(success(module, 'Módulo completo obtenido con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.createModule = async (req, res, next) => {
  try {
    // Validar inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const module = await moduleService.createModule(req.body);
    res.status(201).json(success(module, 'Módulo creado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.updateModule = async (req, res, next) => {
  try {
    // Validar inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const moduleId = req.params.id;
    const module = await moduleService.updateModule(moduleId, req.body);

    res.json(success(module, 'Módulo actualizado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.deleteModule = async (req, res, next) => {
  try {
    const moduleId = req.params.id;
    const result = await moduleService.deleteModule(moduleId);

    res.json(success(null, result.message));
  } catch (err) {
    next(err);
  }
};

exports.startModule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const moduleId = req.params.id;

    const userModule = await moduleService.startModule(userId, moduleId);
    res.json(success(userModule, 'Módulo iniciado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.completeModule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const moduleId = req.params.id;

    const userModule = await moduleService.completeModule(userId, moduleId);
    res.json(success(userModule, 'Módulo completado con éxito'));
  } catch (err) {
    next(err);
  }
};
