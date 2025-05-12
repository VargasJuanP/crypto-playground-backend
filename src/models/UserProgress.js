const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedModules: {
      type: Number,
      default: 0,
    },
    totalModules: {
      type: Number,
      default: 0,
    },
    completedSubModules: {
      type: Number,
      default: 0,
    },
    totalSubModules: {
      type: Number,
      default: 0,
    },
    completedChallenges: {
      type: Number,
      default: 0,
    },
    totalChallenges: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    maxStreak: {
      type: Number,
      default: 0,
    },
    lastStreakUpdate: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserProgress', UserProgressSchema);
