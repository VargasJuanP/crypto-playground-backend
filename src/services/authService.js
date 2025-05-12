const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const ActivityLog = require('../models/ActivityLog');
const Module = require('../models/Module');
const SubModule = require('../models/SubModule');
const Challenge = require('../models/Challenge');
const { generateToken } = require('../utils/jwtUtils');
const { error } = require('../utils/responseFormatter');

exports.register = async (userData) => {
  // Verificar si el usuario ya existe
  const existingUser = await User.findOne({
    $or: [{ email: userData.email }, { username: userData.username }],
  });

  if (existingUser) {
    throw error('Usuario o correo electrónico ya existe', 400);
  }

  // Crear nuevo usuario
  const user = new User(userData);
  await user.save();

  // Inicializar progreso del usuario
  const totalModules = await Module.countDocuments();
  const totalSubModules = await SubModule.countDocuments();
  const totalChallenges = await Challenge.countDocuments();

  await UserProgress.create({
    userId: user._id,
    totalModules,
    totalSubModules,
    totalChallenges,
    completedModules: 0,
    completedSubModules: 0,
    completedChallenges: 0,
    currentStreak: 0,
    maxStreak: 0,
    totalProgress: 0,
  });

  // Registrar actividad
  await ActivityLog.create({
    userId: user._id,
    action: 'login',
    entityType: 'user',
    entityId: user._id,
    details: { method: 'register' },
  });

  // Generar token
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
  // Buscar usuario
  const user = await User.findOne({ email });

  if (!user) {
    throw error('Credenciales inválidas', 401);
  }

  // Verificar contraseña
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw error('Credenciales inválidas', 401);
  }

  // Actualizar última actividad
  user.lastActivity = new Date();
  await user.save();

  // Registrar actividad
  await ActivityLog.create({
    userId: user._id,
    action: 'login',
    entityType: 'user',
    entityId: user._id,
    details: { method: 'credentials' },
  });

  // Generar token
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

exports.getUserFromToken = async (userId) => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw error('Usuario no encontrado', 404);
  }

  return user;
};
