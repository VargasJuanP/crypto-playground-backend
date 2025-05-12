const Challenge = require('../models/Challenge');
const ChallengeSolution = require('../models/ChallengeSolution');
const UserChallenge = require('../models/UserChallenge');
const UserProgress = require('../models/UserProgress');
const Module = require('../models/Module');
const ActivityLog = require('../models/ActivityLog');
const moduleService = require('./moduleService');
const progressService = require('./progressService');
const { error } = require('../utils/responseFormatter');

exports.createChallenge = async (challengeData) => {
  const challenge = await Challenge.create(challengeData);
  return challenge;
};

exports.getAllChallenges = async (userId = null) => {
  const challenges = await Challenge.find();

  // Si hay userId, obtener el estado de cada desafío para el usuario
  if (userId) {
    const userChallenges = await UserChallenge.find({ userId }).lean();
    const userChallengesMap = {};

    userChallenges.forEach((uc) => {
      userChallengesMap[uc.challengeId.toString()] = uc;
    });

    return challenges.map((challenge) => {
      const userChallenge = userChallengesMap[challenge._id.toString()];
      return {
        id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        level: challenge.level,
        duration: challenge.duration,
        submissionCount: challenge.submissionCount,
        completionCount: challenge.completionCount,
        status: userChallenge ? userChallenge.status : 'not-started',
        completed: userChallenge ? userChallenge.completed : false,
        attempts: userChallenge ? userChallenge.attempts : 0,
      };
    });
  }

  return challenges.map((challenge) => ({
    id: challenge._id,
    title: challenge.title,
    description: challenge.description,
    level: challenge.level,
    duration: challenge.duration,
    submissionCount: challenge.submissionCount,
    completionCount: challenge.completionCount,
  }));
};

exports.getChallengeById = async (challengeId, userId = null) => {
  const challenge = await Challenge.findById(challengeId);

  if (!challenge) {
    throw error('Desafío no encontrado', 404);
  }

  // Buscar los módulos que usan este desafío
  const modules = await Module.find({ challengeId });

  const result = {
    id: challenge._id,
    title: challenge.title,
    description: challenge.description,
    level: challenge.level,
    duration: challenge.duration,
    content: challenge.content,
    submissionCount: challenge.submissionCount,
    completionCount: challenge.completionCount,
    validationCriteria: challenge.validationCriteria,
    modules: modules.map((m) => ({
      id: m._id,
      title: m.title,
    })),
  };

  // Si hay userId, agregar información específica del usuario
  if (userId) {
    const userChallenge = await UserChallenge.findOne({ userId, challengeId });

    if (userChallenge) {
      result.status = userChallenge.status;
      result.completed = userChallenge.completed;
      result.attempts = userChallenge.attempts;
      result.startDate = userChallenge.startDate;
      result.completionDate = userChallenge.completionDate;

      // Obtener la mejor solución si existe
      if (userChallenge.bestSolutionId) {
        const bestSolution = await ChallengeSolution.findById(userChallenge.bestSolutionId);
        if (bestSolution) {
          result.bestSolution = {
            id: bestSolution._id,
            solution: bestSolution.solution,
            status: bestSolution.status,
            executionTime: bestSolution.executionTime,
            submissionDate: bestSolution.submissionDate,
          };
        }
      }
    } else {
      result.status = 'not-started';
      result.completed = false;
      result.attempts = 0;
    }

    // Obtener todas las soluciones del usuario para este desafío
    const solutions = await ChallengeSolution.find({
      userId,
      challengeId,
    }).sort({ submissionDate: -1 });

    result.solutions = solutions.map((s) => ({
      id: s._id,
      solution: s.solution,
      status: s.status,
      executionTime: s.executionTime,
      submissionDate: s.submissionDate,
      isFavorite: s.isFavorite,
    }));
  }

  return result;
};

exports.updateChallenge = async (challengeId, challengeData) => {
  const challenge = await Challenge.findByIdAndUpdate(
    challengeId,
    { $set: challengeData },
    { new: true, runValidators: true }
  );

  if (!challenge) {
    throw error('Desafío no encontrado', 404);
  }

  return challenge;
};

exports.deleteChallenge = async (challengeId) => {
  const challenge = await Challenge.findById(challengeId);

  if (!challenge) {
    throw error('Desafío no encontrado', 404);
  }

  // Verificar si este desafío está asociado a algún módulo
  const module = await Module.findOne({ challengeId });
  if (module) {
    throw error(
      `No se puede eliminar el desafío porque está asociado al módulo "${module.title}"`,
      400
    );
  }

  // Eliminar desafío y datos relacionados
  await Promise.all([
    UserChallenge.deleteMany({ challengeId }),
    ChallengeSolution.deleteMany({ challengeId }),
    Challenge.findByIdAndDelete(challengeId),
  ]);

  return { message: 'Desafío eliminado con éxito' };
};

exports.startChallenge = async (userId, challengeId) => {
  // Validar que el desafío existe
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw error('Desafío no encontrado', 404);
  }

  // Buscar en qué módulo está este desafío
  const module = await Module.findOne({ challengeId });

  // Buscar o crear registro de usuario-desafío
  let userChallenge = await UserChallenge.findOne({ userId, challengeId });

  if (!userChallenge) {
    userChallenge = new UserChallenge({
      userId,
      challengeId,
      status: 'not-started',
      attempts: 0,
      completed: false,
    });
  }

  // Solo actualizar si no está ya iniciado
  if (userChallenge.status === 'not-started') {
    userChallenge.status = 'in-progress';
    userChallenge.startDate = new Date();
    userChallenge.lastActivity = new Date();
    await userChallenge.save();

    // Si el desafío está asociado a un módulo, asegurarse de que esté marcado como en progreso
    if (module) {
      await moduleService.startModule(userId, module._id);
    }

    // Registrar actividad
    await ActivityLog.create({
      userId,
      action: 'challenge_started',
      entityType: 'challenge',
      entityId: challengeId,
      details: {
        challengeTitle: challenge.title,
        moduleId: module ? module._id : null,
        moduleTitle: module ? module.title : null,
      },
    });

    // Actualizar racha
    await progressService.updateUserStreak(userId);
  }

  return userChallenge;
};

exports.submitChallengeSolution = async (userId, challengeId, solutionData) => {
  // Validar que el desafío existe
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw error('Desafío no encontrado', 404);
  }

  // Validar datos mínimos de la solución
  if (!solutionData.solution) {
    throw error('La solución es requerida', 400);
  }

  // Iniciar el desafío si no lo está
  let userChallenge = await UserChallenge.findOne({ userId, challengeId });
  if (!userChallenge) {
    userChallenge = await this.startChallenge(userId, challengeId);
  }

  // Evaluar la solución (aquí implementarías tu lógica real de evaluación)
  // Por simplicidad, vamos a simular una evaluación
  const evaluationResult = this.evaluateSolution(challenge, solutionData.solution);

  // Crear registro de solución
  const solution = new ChallengeSolution({
    userId,
    challengeId,
    solution: solutionData.solution,
    status: evaluationResult.passed ? 'correct' : 'incorrect',
    executionTime: solutionData.executionTime || null,
    testResults: evaluationResult.testResults,
    submissionDate: new Date(),
  });

  await solution.save();

  // Incrementar contador de soluciones enviadas en el desafío
  await Challenge.findByIdAndUpdate(challengeId, { $inc: { submissionCount: 1 } });

  // Actualizar el registro de usuario-desafío
  userChallenge.attempts += 1;
  userChallenge.lastActivity = new Date();

  // Si la solución es correcta y el desafío no estaba completado
  if (evaluationResult.passed && !userChallenge.completed) {
    userChallenge.completed = true;
    userChallenge.status = 'completed';
    userChallenge.completionDate = new Date();
    userChallenge.bestSolutionId = solution._id;

    // Incrementar contador de completados en el desafío
    await Challenge.findByIdAndUpdate(challengeId, { $inc: { completionCount: 1 } });

    // Incrementar contador de desafíos completados del usuario
    await UserProgress.findOneAndUpdate(
      { userId },
      {
        $inc: { completedChallenges: 1 },
        $set: { lastUpdated: new Date() },
      },
      { upsert: true }
    );

    // Registrar actividad de desafío completado
    await ActivityLog.create({
      userId,
      action: 'challenge_completed',
      entityType: 'challenge',
      entityId: challengeId,
      details: {
        challengeTitle: challenge.title,
        attempts: userChallenge.attempts,
        executionTime: solutionData.executionTime,
      },
    });

    // Si el desafío está en un módulo, actualizar el progreso del módulo
    const module = await Module.findOne({ challengeId });
    if (module) {
      await moduleService.calculateModuleProgress(userId, module._id);
    }

    // Actualizar progreso general
    await progressService.calculateTotalProgress(userId);
  } else {
    // Siempre registrar actividad de envío de solución
    await ActivityLog.create({
      userId,
      action: 'challenge_solution_submitted',
      entityType: 'solution',
      entityId: solution._id,
      details: {
        challengeId,
        challengeTitle: challenge.title,
        status: solution.status,
        attemptNumber: userChallenge.attempts,
      },
    });
  }

  await userChallenge.save();

  // Actualizar racha
  await progressService.updateUserStreak(userId);

  return {
    solutionId: solution._id,
    status: solution.status,
    passed: evaluationResult.passed,
    testResults: evaluationResult.testResults,
    attempts: userChallenge.attempts,
    completed: userChallenge.completed,
  };
};

// Función para simular evaluación de solución
// En un entorno real, esta función sería mucho más compleja
exports.evaluateSolution = (challenge, solution) => {
  // Simulación simple - en un caso real, ejecutarías el código contra casos de prueba
  const passed = !!solution && solution.length > 10; // Simplemente verificamos que tenga contenido

  let testResults = [];

  // Si el desafío tiene casos de prueba, simular evaluación
  if (challenge.testCases && challenge.testCases.length > 0) {
    testResults = challenge.testCases.map((testCase, index) => {
      // Simulamos que el primer caso siempre pasa, el resto aleatoriamente
      const testPassed = index === 0 || Math.random() > 0.3;
      return {
        testCase: index + 1,
        passed: testPassed,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: testPassed ? testCase.expectedOutput : 'Output incorrecto',
      };
    });

    // La solución completa pasa si todos los casos de prueba pasan
    const allPassed = testResults.every((tr) => tr.passed);
    return { passed: allPassed, testResults };
  }

  return {
    passed,
    testResults,
  };
};

exports.getSolutionsForChallenge = async (challengeId, userId = null) => {
  const challenge = await Challenge.findById(challengeId);

  if (!challenge) {
    throw error('Desafío no encontrado', 404);
  }

  let query = { challengeId };

  // Si se especifica userId, filtrar por ese usuario
  if (userId) {
    query.userId = userId;
  }

  // Obtener soluciones
  const solutions = await ChallengeSolution.find(query)
    .populate('userId', 'username')
    .sort({ submissionDate: -1 });

  return solutions.map((s) => ({
    id: s._id,
    username: s.userId.username,
    solution: s.solution,
    status: s.status,
    executionTime: s.executionTime,
    submissionDate: s.submissionDate,
    isFavorite: s.isFavorite,
  }));
};

exports.markSolutionAsFavorite = async (userId, solutionId) => {
  const solution = await ChallengeSolution.findById(solutionId);

  if (!solution) {
    throw error('Solución no encontrada', 404);
  }

  // Verificar que la solución pertenece al usuario
  if (solution.userId.toString() !== userId) {
    throw error('No tienes permiso para modificar esta solución', 403);
  }

  // Primero quitamos la marca de favorito de todas las soluciones de este usuario para este desafío
  await ChallengeSolution.updateMany(
    { userId, challengeId: solution.challengeId },
    { $set: { isFavorite: false } }
  );

  // Luego marcamos la solución específica como favorita
  solution.isFavorite = true;
  await solution.save();

  // Actualizar la mejor solución en UserChallenge
  await UserChallenge.findOneAndUpdate(
    { userId, challengeId: solution.challengeId },
    { $set: { bestSolutionId: solutionId } }
  );

  return solution;
};
