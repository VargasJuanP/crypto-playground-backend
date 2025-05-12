const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { success } = require('../utils/responseFormatter');

exports.register = async (req, res, next) => {
  try {
    // Validar inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;
    const result = await authService.register({ username, email, password });

    res.status(201).json(success(result, 'Usuario registrado exitosamente'));
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    // Validar inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.json(success(result, 'Login exitoso'));
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  // req.user ya está disponible gracias al middleware auth
  res.json(success(req.user, 'Información del usuario actual'));
};

exports.refreshToken = async (req, res, next) => {
  try {
    // El middleware auth ya ha verificado el token y proporcionado req.user
    const { generateToken } = require('../utils/jwtUtils');
    const newToken = generateToken(req.user.id);

    res.json(success({ token: newToken }, 'Token actualizado exitosamente'));
  } catch (err) {
    next(err);
  }
};
