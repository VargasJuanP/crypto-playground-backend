const mongoose = require('mongoose');

const ChallengeSolutionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
    },
    subModuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubModule',
    },
    solution: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'correct', 'incorrect'],
      default: 'pending',
    },
    executionTime: {
      type: Number,
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    testResults: [
      {
        testCase: Number,
        passed: Boolean,
        input: String,
        expectedOutput: String,
        actualOutput: String,
      },
    ],
    // Para marcar una solución como la "favorita" o "mejor" del usuario
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChallengeSolution', ChallengeSolutionSchema);
