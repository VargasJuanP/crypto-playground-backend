const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/jwt');

exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, secret, { expiresIn });
};
