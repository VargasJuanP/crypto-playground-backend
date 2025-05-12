const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'login',
        'module_started',
        'module_completed',
        'submodule_started',
        'submodule_completed',
        'challenge_started',
        'challenge_solution_submitted',
        'challenge_completed',
        'profile_updated',
        'profile_image_updated',
      ],
      required: true,
    },
    entityType: {
      type: String,
      enum: ['module', 'submodule', 'challenge', 'solution', 'user', 'system'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'entityType',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Índice para búsquedas rápidas por usuario
ActivityLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
