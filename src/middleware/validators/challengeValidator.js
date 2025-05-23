// middleware/validators/challengeValidator.js
const { body, param } = require('express-validator');

exports.createChallengeValidator = [
  body('id')
    .isString()
    .notEmpty()
    .withMessage('El ID del desafío es requerido'),
  body('title')
    .isString()
    .notEmpty()
    .withMessage('El título es requerido'),
  body('description')
    .isString()
    .notEmpty()
    .withMessage('La descripción es requerida'),
  body('difficulty')
    .isIn(['principiante', 'intermedio', 'avanzado', 'experto'])
    .withMessage('Dificultad no válida'),
  body('category')
    .isString()
    .notEmpty()
    .withMessage('La categoría es requerida'),
  body('points')
    .isInt({ min: 0 })
    .withMessage('Los puntos deben ser un número entero positivo'),
  body('timeEstimate')
    .isString()
    .notEmpty()
    .withMessage('El tiempo estimado es requerido'),
  body('status')
    .optional()
    .isIn(['disponible', 'bloqueado', 'mantenimiento', 'archivado'])
    .withMessage('Estado no válido'),
  body('examples')
    .isArray()
    .withMessage('Los ejemplos deben ser un array'),
  body('examples.*.input')
    .optional()
    .isString(),
  body('examples.*.output')
    .optional()
    .isString(),
  body('examples.*.explanation')
    .optional()
    .isString(),
  body('constraints')
    .optional()
    .isArray()
    .withMessage('Las restricciones deben ser un array'),
  body('hint')
    .optional()
    .isString(),
  body('starterCode.python')
    .optional()
    .isString(),
  body('starterCode.javascript')
    .optional()
    .isString(),
  body('tests.python')
    .isString()
    .withMessage('Los tests para Python son requeridos'),
  body('tests.javascript')
    .isString()
    .withMessage('Los tests para JavaScript son requeridos')
];

exports.updateChallengeValidator = [
  param('id')
    .isMongoId()
    .withMessage('ID de desafío no válido'),
  body('title')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('El título no puede estar vacío'),
  body('description')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('La descripción no puede estar vacía'),
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
  body('examples')
    .optional()
    .isArray()
    .withMessage('Los ejemplos deben ser un array'),
  body('constraints')
    .optional()
    .isArray()
    .withMessage('Las restricciones deben ser un array'),
  body('tests.python')
    .optional()
    .isString(),
  body('tests.javascript')
    .optional()
    .isString()
];

exports.submitChallengeValidator = [
  param('id')
    .isMongoId()
    .withMessage('ID de desafío no válido'),
  body('code')
    .isString()
    .notEmpty()
    .withMessage('El código es requerido'),
  body('language')
    .isIn(['python', 'javascript'])
    .withMessage('Lenguaje no soportado')
];