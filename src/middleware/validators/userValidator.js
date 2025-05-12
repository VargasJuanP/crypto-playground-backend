const { body } = require('express-validator');

exports.registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres'),

  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un correo electrónico válido'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
];

exports.loginValidator = [
  body('email').isEmail().withMessage('Debe proporcionar un correo electrónico válido'),
  body('password').exists().withMessage('La contraseña es requerida'),
];

exports.updateUserValidator = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un correo electrónico válido'),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
];
