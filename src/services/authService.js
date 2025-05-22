const User = require('../models/User');

const ModuleService = require('./moduleService');

const { error } = require('../utils/responseFormatter');
const { generateToken } = require('../utils/jwtUtils');

exports.register = async (userData) => {
  const userExists = await User.findOne({
    $or: [{ email: userData.email }, { username: userData.username }],
  });

  if (userExists) {
    throw error('Usuario o correo electrónico ya existe', 400);
  }

  const user = new User(userData);
  await user.save();

  // Crear modulos del usuario
  await ModuleService.createUserModulesForUser(user._id);

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
};

exports.login = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw error('Credenciales inválidas', 401);
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw error('Credenciales inválidas', 401);
  }

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
};
