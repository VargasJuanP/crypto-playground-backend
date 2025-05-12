const { body } = require('express-validator');

exports.challengeValidator = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El título debe tener entre 3 y 100 caracteres'),

  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('La descripción debe tener al menos 10 caracteres'),

  body('level')
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('El nivel debe ser beginner, intermediate, advanced o expert'),

  body('duration').trim().notEmpty().withMessage('La duración es requerida'),

  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('El contenido debe tener al menos 10 caracteres'),

  body('validationCriteria')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Los criterios de validación deben tener al menos 10 caracteres'),

  body('testCases').optional().isArray().withMessage('Los casos de prueba deben ser un arreglo'),

  body('testCases.*.input')
    .optional()
    .isString()
    .withMessage('El input de cada caso de prueba debe ser una cadena'),

  body('testCases.*.expectedOutput')
    .optional()
    .isString()
    .withMessage('El output esperado de cada caso de prueba debe ser una cadena'),
];
