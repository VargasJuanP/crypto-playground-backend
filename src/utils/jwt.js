require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'crypto_course_secret_key',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
};
