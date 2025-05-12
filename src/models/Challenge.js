const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
    completionCount: {
      type: Number,
      default: 0,
    },
    validationCriteria: {
      type: String,
      required: true,
    },
    testCases: [
      {
        input: String,
        expectedOutput: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Challenge', ChallengeSchema);
