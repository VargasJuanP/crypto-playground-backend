const authService = require('../services/authService');
const { validationResult } = require('express-validator');
const { success } = require('../utils/responseFormatter');

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { username, email, password } = req.body;

    const result = await authService.register({ username, email, password });

    res.status(201).json(success(result, 'Registro exitoso'));
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json(success(result, 'Login exitoso'));
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  res.status(200).json(success(req.user, 'Usuario actual'));
};
