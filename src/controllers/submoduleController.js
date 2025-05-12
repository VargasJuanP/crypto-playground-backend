const submoduleService = require('../services/submoduleService');
const { validationResult } = require('express-validator');
const { success } = require('../utils/responseFormatter');

exports.getAllSubModules = async (req, res, next) => {
  try {
    const subModules = await submoduleService.getAllSubModules();
    res.json(success(subModules, 'Submódulos obtenidos con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getSubModuleById = async (req, res, next) => {
  try {
    const subModuleId = req.params.id;
    const userId = req.user ? req.user.id : null;

    const subModule = await submoduleService.getSubModuleById(subModuleId, userId);
    res.json(success(subModule, 'Submódulo obtenido con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.createSubModule = async (req, res, next) => {
  try {
    // Validar inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const subModule = await submoduleService.createSubModule(req.body);
    res.status(201).json(success(subModule, 'Submódulo creado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.updateSubModule = async (req, res, next) => {
  try {
    // Validar inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const subModuleId = req.params.id;
    const subModule = await submoduleService.updateSubModule(subModuleId, req.body);

    res.json(success(subModule, 'Submódulo actualizado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.deleteSubModule = async (req, res, next) => {
  try {
    const subModuleId = req.params.id;
    const result = await submoduleService.deleteSubModule(subModuleId);

    res.json(success(null, result.message));
  } catch (err) {
    next(err);
  }
};

exports.startSubModule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subModuleId = req.params.id;

    const userSubModule = await submoduleService.startSubModule(userId, subModuleId);
    res.json(success(userSubModule, 'Submódulo iniciado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.completeSubModule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subModuleId = req.params.id;

    const userSubModule = await submoduleService.completeSubModule(userId, subModuleId);
    res.json(success(userSubModule, 'Submódulo completado con éxito'));
  } catch (err) {
    next(err);
  }
};
