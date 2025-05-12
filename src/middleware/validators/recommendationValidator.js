const { body } = require('express-validator');

exports.recommendationValidator = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El título debe tener entre 3 y 100 caracteres'),

  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('La descripción debe tener al menos 10 caracteres'),

  body('type')
    .isIn(['module', 'challenge', 'community'])
    .withMessage('El tipo debe ser module, challenge o community'),

  body('priority')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('La prioridad debe ser un número entre 0 y 100'),

  body('moduleId').optional().isMongoId().withMessage('ID de módulo inválido'),

  body('challengeId').optional().isMongoId().withMessage('ID de desafío inválido'),
];
