const mongoose = require('mongoose');

const UserChallengeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
    },
    status: {
      type: String,
      enum: ['no-iniciado', 'en-progreso', 'completado'],
      default: 'no-iniciado',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    lastSubmittedCode: {
      type: String,
      default: null,
    },
    language: {
      type: String,
      enum: ['python', 'javascript'],
      default: 'python',
    },
  },
  { timestamps: true }
);

UserChallengeSchema.index({ user: 1, challenge: 1 }, { unique: true });
UserChallengeSchema.index({ user: 1 });
UserChallengeSchema.index({ challenge: 1 });

module.exports = mongoose.model('UserChallenge', UserChallengeSchema);
