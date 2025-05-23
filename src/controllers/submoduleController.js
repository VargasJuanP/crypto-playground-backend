const submoduleService = require('../services/submoduleService');

const { validationResult } = require('express-validator');

const { success } = require('../utils/responseFormatter');

exports.createSubModule = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const subModule = await submoduleService.createSubModule(req.body);

    res.status(201).json(success(subModule, 'Submódulo creado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.updateSubModule = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const subModule = await submoduleService.updateSubModule(req.params.id, req.body);

    res.status(200).json(success(subModule, 'Submódulo actualizado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.getSubModules = async (req, res, next) => {
  try {
    const subModules = await submoduleService.getFullSubModulesByModuleId(
      req.user.id,
      req.params.id
    );

    res.status(200).json(success(subModules, 'Submódulos obtenidos con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.startSubModule = async (req, res, next) => {
  try {
    const userSubModule = await submoduleService.startSubModule(req.user.id, req.params.id);

    res.status(200).json(success(userSubModule, 'Submódulo iniciado con éxito'));
  } catch (err) {
    next(err);
  }
};

exports.completeSubModule = async (req, res, next) => {
  try {
    const userSubModule = await submoduleService.completeSubModule(req.user.id, req.params.id);

    res.status(200).json(success(userSubModule, 'Submódulo completado con éxito'));
  } catch (err) {
    next(err);
  }
};
