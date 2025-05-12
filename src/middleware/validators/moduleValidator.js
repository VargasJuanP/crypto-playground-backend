const { body } = require('express-validator');

exports.moduleValidator = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El título debe tener entre 3 y 100 caracteres'),

  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('La descripción debe tener al menos 10 caracteres'),

  body('level')
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .withMessage('El nivel debe ser Beginner, Intermediate, Advanced o Expert'),

  body('duration').trim().notEmpty().withMessage('La duración es requerida'),

  body('order').isInt({ min: 1 }).withMessage('El orden debe ser un número entero positivo'),

  body('subModules').optional().isArray().withMessage('subModules debe ser un array de IDs'),

  body('challengeId').optional().isMongoId().withMessage('challengeId debe ser un ID válido'),
];
