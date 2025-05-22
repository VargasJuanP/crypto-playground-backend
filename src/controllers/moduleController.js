const moduleService = require('../services/moduleService');
const { validationResult } = require('express-validator');
const { success } = require('../utils/responseFormatter');

exports.createModule = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const module = await moduleService.createModule(req.body);

    res.status(201).json(success(module, 'Módulo creado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.updateModule = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const module = await moduleService.updateModule(req.params.id, req.body);

    res.status(200).json(success(module, 'Módulo actualizado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getModules = async (req, res, next) => {
  try {
    const modules = await moduleService.getModules(req.user.id);

    res.status(200).json(success(modules, 'Módulos obtenidos con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getModuleById = async (req, res, next) => {
  try {
    const module = await moduleService.getModuleById(req.params.id, req.user.id);

    res.status(200).json(success(module, 'Módulo obtenido con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.startModule = async (req, res, next) => {
  try {
    const userModule = await moduleService.startModule(req.user.id, req.params.id);

    res.status(200).json(success(userModule, 'Módulo iniciado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.completeModule = async (req, res, next) => {
  try {
    const userModule = await moduleService.completeModule(req.user.id, req.params.id);

    res.status(200).json(success(userModule, 'Módulo completado con éxito'));
  } catch (err) {
    next(err);
  }
};
