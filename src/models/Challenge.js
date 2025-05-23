// models/Challenge.js
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
    examples: [{
      input: String,
      output: String,
      explanation: String
    }],
    constraints: [String],
    hint: String,
    starterCode: {
      python: String,
      javascript: String
    },
    tests: {
      python: {
        type: String,
        description: "Archivo de tests para Python que verifica la solución del desafío"
      },
      javascript: {
        type: String,
        description: "Archivo de tests para JavaScript que verifica la solución del desafío"
      }
    }
  },
  { timestamps: true }
);

ChallengeSchema.index({ difficulty: 1 });
ChallengeSchema.index({ category: 1 });
ChallengeSchema.index({ status: 1 });
ChallengeSchema.index({ points: 1 });

module.exports = mongoose.model('Challenge', ChallengeSchema);