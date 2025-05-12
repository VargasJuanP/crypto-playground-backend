const mongoose = require('mongoose');

const UserSubModuleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subModuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubModule',
      required: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
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
UserSubModuleSchema.index({ userId: 1, subModuleId: 1 }, { unique: true });

module.exports = mongoose.model('UserSubModule', UserSubModuleSchema);
