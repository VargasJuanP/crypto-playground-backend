const { body } = require('express-validator');

exports.registerValidator = [
  body('username').trim().isLength({ min: 1, max: 30 }),

  body('email').trim().isEmail().normalizeEmail(),

  body('password').exists(),
];

exports.loginValidator = [
  body('email').trim().isEmail().normalizeEmail(),

  body('password').exists(),
];

exports.updateUserValidator = [
  body('username').optional().trim().isLength({ min: 1, max: 30 }),

  body('email').optional().trim().isEmail().normalizeEmail(),

  body('password').optional(),
];
