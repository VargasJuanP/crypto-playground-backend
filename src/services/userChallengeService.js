const UserChallenge = require('../models/UserChallenge');
const Challenge = require('../models/Challenge');

exports.getUserChallenges = async (userId) => {
  const userChallenges = await UserChallenge.find({ user: userId })
    .populate('challenge')
    .sort({ updatedAt: -1 });

  return userChallenges.map((uc) => ({
    id: uc._id,
    challengeId: uc.challenge._id,
    title: uc.challenge.title,
    difficulty: uc.challenge.difficulty,
    category: uc.challenge.category,
    status: uc.status,
    attempts: uc.attempts,
    completedAt: uc.completedAt,
    lastAttemptAt: uc.lastAttemptAt,
    points: uc.challenge.points,
  }));
};

exports.getUserChallengeStats = async (userId) => {
  const userChallenges = await UserChallenge.find({ user: userId });

  const totalChallenges = await Challenge.countDocuments();
  const completedChallenges = userChallenges.filter((uc) => uc.status === 'completado').length;
  const inProgressChallenges = userChallenges.filter((uc) => uc.status === 'en-progreso').length;
  const notStartedChallenges = totalChallenges - completedChallenges - inProgressChallenges;

  // Calcular puntos totales
  const completedChallengeIds = userChallenges
    .filter((uc) => uc.status === 'completado')
    .map((uc) => uc.challenge);

  const completedChallengesWithPoints = await Challenge.find({
    _id: { $in: completedChallengeIds },
  });

  const totalPoints = completedChallengesWithPoints.reduce((sum, challenge) => {
    return sum + challenge.points;
  }, 0);

  // Estadísticas por categoría
  const categoryChallenges = await Challenge.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
  ]);

  const categoryStats = {};
  for (const cat of categoryChallenges) {
    categoryStats[cat._id] = {
      total: cat.count,
      completed: 0,
    };
  }

  // Obtener completados por categoría
  const completedChallengesByCategory = await Challenge.find({
    _id: { $in: completedChallengeIds },
  });

  completedChallengesByCategory.forEach((challenge) => {
    if (categoryStats[challenge.category]) {
      categoryStats[challenge.category].completed += 1;
    }
  });

  return {
    totalChallenges,
    completedChallenges,
    inProgressChallenges,
    notStartedChallenges,
    completionRate: totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0,
    totalPoints,
    categoryStats,
  };
};

// services/userChallengeService.js (continuación)
exports.createUserChallenge = async (userId, challengeId) => {
  return await UserChallenge.create({
    user: userId,
    challenge: challengeId,
    status: 'no-iniciado',
  });
};

exports.updateUserChallengeStatus = async (userId, challengeId, status) => {
  const validStatuses = ['no-iniciado', 'en-progreso', 'completado'];

  if (!validStatuses.includes(status)) {
    throw new Error('Estado no válido');
  }

  const updates = { status };

  if (status === 'completado') {
    updates.completedAt = new Date();
  }

  return await UserChallenge.findOneAndUpdate(
    { user: userId, challenge: challengeId },
    { $set: updates },
    { new: true, runValidators: true }
  );
};

exports.incrementAttempt = async (userId, challengeId, code, language) => {
  return await UserChallenge.findOneAndUpdate(
    { user: userId, challenge: challengeId },
    {
      $inc: { attempts: 1 },
      $set: {
        lastAttemptAt: new Date(),
        lastSubmittedCode: code,
        language,
      },
    },
    { new: true, runValidators: true, upsert: true }
  );
};

exports.getUserChallengeByIds = async (userId, challengeId) => {
  return await UserChallenge.findOne({ user: userId, challenge: challengeId });
};
