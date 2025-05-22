const mongoose = require('mongoose');

const UserModuleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    status: {
      type: String,
      enum: ['bloqueado', 'no-iniciado', 'en-progreso', 'completado'],
      default: 'bloqueado',
    },
    progress: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

UserModuleSchema.index({ user: 1, module: 1 }, { unique: true });

UserModuleSchema.index({ user: 1 });

module.exports = mongoose.model('UserModule', UserModuleSchema);
