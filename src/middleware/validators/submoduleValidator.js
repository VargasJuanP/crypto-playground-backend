const mongoose = require('mongoose');

const { body } = require('express-validator');

exports.createSubmoduleValidator = [
  body('module').custom((value) => mongoose.Types.ObjectId.isValid(value)),

  body('title').trim().isLength({ min: 1, max: 100 }),

  body('place').isInt({ min: 1 }),
];

exports.updateSubmoduleValidator = [
  body('title').trim().optional().isLength({ min: 1, max: 100 }),

  body('place').optional().isInt({ min: 1 }),
];
