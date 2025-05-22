const mongoose = require('mongoose');

const UserSubModuleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subModule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubModule',
      required: true,
    },
    status: {
      type: String,
      enum: ['no-iniciado', 'en-progreso', 'completado'],
      default: 'no-iniciado',
    },
  },
  { timestamps: true }
);

UserSubModuleSchema.index({ user: 1, subModule: 1 }, { unique: true });

UserSubModuleSchema.index({ user: 1 });

module.exports = mongoose.model('UserSubModule', UserSubModuleSchema);
