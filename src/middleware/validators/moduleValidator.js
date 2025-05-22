const { body } = require('express-validator');

exports.createModuleValidator = [
  body('title').trim().isLength({ min: 1, max: 100 }),

  body('description').trim().isLength({ min: 1, max: 100 }),

  body('duration').trim().isLength({ min: 1, max: 30 }),

  body('level').isIn(['Principiante', 'Intermedio', 'Avanzado']),

  body('place').isInt({ min: 1 }),
];

exports.updateModuleValidator = [
  body('title').optional().trim().isLength({ min: 1, max: 100 }),

  body('description').optional().trim().isLength({ min: 1, max: 100 }),

  body('duration').optional().trim().isLength({ min: 1, max: 30 }),

  body('level').optional().isIn(['Principiante', 'Intermedio', 'Avanzado']),

  body('place').optional().isInt({ min: 1 }),
];
