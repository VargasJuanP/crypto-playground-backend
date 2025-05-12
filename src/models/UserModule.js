const mongoose = require('mongoose');

const UserModuleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started',
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
UserModuleSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

module.exports = mongoose.model('UserModule', UserModuleSchema);
