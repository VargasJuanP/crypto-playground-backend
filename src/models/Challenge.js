const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['principiante', 'intermedio', 'avanzado', 'experto'],
      required: true
    },
    category: {
      type: String,
      required: true
    },
    completions: {
      type: Number,
      default: 0
    },
    totalAttempts: {
      type: Number,
      default: 0
    },
    points: {
      type: Number,
      required: true,
      min: 0
    },
    timeEstimate: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['disponible', 'bloqueado', 'mantenimiento', 'archivado'],
      default: 'disponible'
    },
    dateAdded: {
      type: String,  // Formato "YYYY-MM-DD"
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    examples: [{
      input: String,
      output: String,
      explanation: String
    }],
    constraints: [String],
    hint: String,
    expectedOutput: String,
    inputData: String,
    starterCode: {
      python: String,
      javascript: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Challenge', ChallengeSchema);