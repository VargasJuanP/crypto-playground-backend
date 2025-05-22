const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, autorización denegada' });
    }

    // Verificar token
    const decoded = jwt.verify(token, secret);

    // Buscar usuario
    const user = await User.findById(decoded.id).select('-password -__v');

    if (!user) {
      return res.status(401).json({ message: 'Token no válido' });
    }

    // Agregar usuario al request
    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token no válido' });
  }
};
