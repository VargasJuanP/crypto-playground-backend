const { body } = require('express-validator');

exports.submoduleValidator = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El título debe tener entre 3 y 100 caracteres'),

  body('order').isInt({ min: 1 }).withMessage('El orden debe ser un número entero positivo'),
];
