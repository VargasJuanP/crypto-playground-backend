const mongoose = require('mongoose');

const UserChallengeSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    bestSolutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChallengeSolution',
    },
    startDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Índice compuesto para búsquedas eficientes
UserChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

module.exports = mongoose.model('UserChallenge', UserChallengeSchema);
