const Challenge = require('../models/Challenge');
const UserChallenge = require('../models/UserChallenge');
const axios = require('axios');
const UserService = require('./userService');

// URL de la API de Piston
const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

exports.createChallenge = async (challengeData) => {
  return await Challenge.create(challengeData);
};

exports.updateChallenge = async (challengeId, challengeData) => {
  return await Challenge.findByIdAndUpdate(
    challengeId,
    { $set: challengeData },
    { new: true, runValidators: true }
  );
};

exports.getChallengeById = async (challengeId, userId) => {
  const challenge = await Challenge.findById(challengeId);

  if (!challenge) {
    throw new Error('Desafío no encontrado');
  }

  // Obtener información del progreso del usuario
  const userChallenge = await UserChallenge.findOne({ user: userId, challenge: challengeId });

  return {
    ...challenge.toObject(),
    userStatus: userChallenge ? userChallenge.status : 'no-iniciado',
    attempts: userChallenge ? userChallenge.attempts : 0,
    code: userChallenge ? userChallenge.lastSubmittedCode : '',
  };
};

exports.getChallenges = async (userId, filters = {}) => {
  // Construir filtros para la consulta
  const queryFilters = {
    module: { $exists: false },
  };

  if (filters.category) queryFilters.category = filters.category;
  if (filters.difficulty) queryFilters.difficulty = filters.difficulty;
  if (filters.status) queryFilters.status = filters.status;

  // Obtener todos los desafíos que coincidan con los filtros
  const challenges = await Challenge.find(queryFilters);

  // Obtener los desafíos completados por el usuario
  const userChallenges = await UserChallenge.find({ user: userId });

  // Crear un mapa para buscar rápidamente
  const userChallengesMap = {};
  userChallenges.forEach((uc) => {
    userChallengesMap[uc.challenge.toString()] = uc;
  });

  // Combinar la información
  return challenges.map((challenge) => {
    const userChallenge = userChallengesMap[challenge._id.toString()];

    return {
      id: challenge._id,
      title: challenge.title,
      description: challenge.description1,
      difficulty: challenge.difficulty,
      category: challenge.category,
      completions: challenge.completions,
      totalAttempts: challenge.totalAttempts,
      points: challenge.points,
      timeEstimate: challenge.timeEstimate,
      status: challenge.status,
      icon: challenge.icon,
      userStatus: userChallenge ? userChallenge.status : 'no-iniciado',
      attempts: userChallenge ? userChallenge.attempts : 0,
    };
  });
};

exports.submitChallenge = async (userId, challengeId, code, language) => {
  await UserService.updateUserStreak(userId);
  // Validar el lenguaje
  if (!['python', 'javascript'].includes(language)) {
    throw new Error('Lenguaje no soportado');
  }

  // Obtener el desafío
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new Error('Desafío no encontrado');
  }

  // Actualizar el intento del usuario
  let userChallenge = await UserChallenge.findOne({ user: userId, challenge: challengeId });

  if (!userChallenge) {
    userChallenge = await UserChallenge.create({
      user: userId,
      challenge: challengeId,
      status: 'en-progreso',
      attempts: 1,
      lastAttemptAt: new Date(),
      language,
    });
  } else {
    userChallenge.attempts += 1;
    userChallenge.lastAttemptAt = new Date();
    userChallenge.language = language;
    await userChallenge.save();
  }

  // Actualizar contador de intentos totales del desafío
  await Challenge.findByIdAndUpdate(challengeId, { $inc: { totalAttempts: 1 } });

  // Ejecutar el código usando Piston API
  const pistonResponse = await this.executePistonCode(code, language, challenge, userChallenge);

  // Si el código pasa todas las pruebas
  if (pistonResponse.success) {
    userChallenge.lastSubmittedCode = code;
    // Marcar como completado si no lo estaba ya
    if (userChallenge.status !== 'completado') {
      userChallenge.status = 'completado';
      userChallenge.completedAt = new Date();
      // Incrementar el contador de completados
      await Challenge.findByIdAndUpdate(challengeId, { $inc: { completions: 1 } });
      // Sumar puntos al usuario
      await UserService.addPointsToUser(userId, challenge.points);
    }

    await userChallenge.save();
  }

  return pistonResponse;
};

exports.executePistonCode = async (code, language, challenge, userChallenge) => {
  const languageConfig = {
    python: {
      language: 'python3',
      version: '3.10.0',
    },
    javascript: {
      language: 'javascript',
      version: '18.15.0',
    },
  };

  const main = language === 'python' ? 'main.py' : 'main.js';

  // Configurar payload para Piston API
  const payload = {
    language: languageConfig[language].language,
    version: languageConfig[language].version,
    files: [
      {
        name: main,
        content: code + '\n' + challenge.tests[language],
      },
    ],
    stdin: challenge.inputData || '',
    args: [],
    compile_timeout: 10000,
    run_timeout: 5000,
    compile_memory_limit: -1,
    run_memory_limit: -1,
  };

  try {
    const response = await axios.post(PISTON_API_URL, payload);

    // Analizar la respuesta
    const { stdout, stderr, code: exitCode, signal } = response.data.run;

    // Verificar si hay errores de ejecución
    if (stderr || exitCode !== 0 || signal) {
      return {
        success: false,
        details: {
          message: 'Error al ejecutar el código',
          stderr,
          exitCode,
          stdout,
          signal,
        },
      };
    }

    const testsPassed = stdout.includes('SUCCESS');

    return {
      success: testsPassed,
      details: {
        output: stdout,
        expected: challenge.expectedOutput,
        testsPassed,
      },
    };
  } catch (error) {
    console.error('Error al comunicarse con Piston API:', error.message);

    // Comprobación alternativa: intentar con un API endpoint diferente
    try {
      // URL alternativa de Piston API
      const ALTERNATIVE_PISTON_API = 'https://piston.dev/api/v2/execute';

      const altResponse = await axios.post(ALTERNATIVE_PISTON_API, payload);

      const { stdout, stderr, code: exitCode } = altResponse.data.run;

      if (stderr || exitCode !== 0) {
        return {
          success: false,
          details: {
            message: 'Error al ejecutar el código con API alternativa',
            stderr,
            exitCode,
            stdout,
          },
        };
      }

      const testsPassed = stdout.includes('SUCCESS');

      return {
        success: testsPassed,
        details: {
          output: stdout,
          expected: challenge.expectedOutput,
          testsPassed,
        },
      };
    } catch (altError) {
      // Si ambos intentos fallan, devolver el error original
      return {
        success: false,
        details: {
          message: 'Error al comunicarse con Piston API',
          error: error.message,
          response: error.response?.data,
          alternativeError: altError.message,
        },
      };
    }
  }
};

exports.createUserChallenge = async (userId, challengeId) => {
  return await UserChallenge.create({
    user: userId,
    challenge: challengeId,
    status: 'no-iniciado',
  });
};

exports.updateUserChallengeStatus = async (userId, challengeId, status) => {
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

exports.getChallengeByModule = async (user, module) => {
  const challenge = await Challenge.findOne({ module });

  return await this.getChallengeById(challenge._id, user);
};
