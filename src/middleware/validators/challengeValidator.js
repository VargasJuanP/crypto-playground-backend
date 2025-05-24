const mongoose = require('mongoose');

const { body, param } = require('express-validator');

exports.createChallengeValidator = [
  body('id').isString().notEmpty().withMessage('El ID del desafío es requerido'),
  body('title').isString().notEmpty().withMessage('El título es requerido'),
  body('description1').isString().notEmpty().withMessage('La descripción 1 es requerida'),
  body('description2').isString().notEmpty().withMessage('La descripción 2 es requerida'),
  body('difficulty')
    .isIn(['principiante', 'intermedio', 'avanzado', 'experto'])
    .withMessage('Dificultad no válida'),
  body('category').isString().notEmpty().withMessage('La categoría es requerida'),
  body('points').isInt({ min: 0 }).withMessage('Los puntos deben ser un número entero positivo'),
  body('timeEstimate').isString().notEmpty().withMessage('El tiempo estimado es requerido'),
  body('status')
    .optional()
    .isIn(['disponible', 'bloqueado', 'mantenimiento', 'archivado'])
    .withMessage('Estado no válido'),
  body('examples').isArray().withMessage('Los ejemplos deben ser un array'),
  body('examples.*.input').optional().isString(),
  body('examples.*.output').optional().isString(),
  body('examples.*.explanation').optional().isString(),
  body('constraints').optional().isArray().withMessage('Las restricciones deben ser un array'),
  body('hint').optional().isString(),
  body('starterCode.python').optional().isString(),
  body('starterCode.javascript').optional().isString(),
  body('tests.python').isString().withMessage('Los tests para Python son requeridos'),
  body('tests.javascript').isString().withMessage('Los tests para JavaScript son requeridos'),
  body('icon').isString(),
  body('module')
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value)),
];

exports.updateChallengeValidator = [
  param('id').isMongoId().withMessage('ID de desafío no válido'),
  body('title').optional().isString().notEmpty().withMessage('El título no puede estar vacío'),
  body('description1')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('La descripción 1 no puede estar vacía'),
  body('description2')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('La descripción 2 no puede estar vacía'),
  body('difficulty')
    .optional()
    .isIn(['principiante', 'intermedio', 'avanzado', 'experto'])
    .withMessage('Dificultad no válida'),
  body('category')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('La categoría no puede estar vacía'),
  body('points')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Los puntos deben ser un número entero positivo'),
  body('timeEstimate')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('El tiempo estimado no puede estar vacío'),
  body('status')
    .optional()
    .isIn(['disponible', 'bloqueado', 'mantenimiento', 'archivado'])
    .withMessage('Estado no válido'),
  body('examples').optional().isArray().withMessage('Los ejemplos deben ser un array'),
  body('constraints').optional().isArray().withMessage('Las restricciones deben ser un array'),
  body('tests.python').optional().isString(),
  body('tests.javascript').optional().isString(),
  body('icon').optional().isString(),
  body('module')
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value)),
];

exports.submitChallengeValidator = [
  param('id').isMongoId().withMessage('ID de desafío no válido'),
  body('code').isString().notEmpty().withMessage('El código es requerido'),
  body('language').isIn(['python', 'javascript']).withMessage('Lenguaje no soportado'),
];
