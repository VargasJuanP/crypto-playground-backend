const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  achievement: {
    type: String,
    required: true,
  },
  place: {
    type: Number,
    required: true,
    min: 1,
  },
  level: {
    type: String,
    required: true,
    enum: ['Principiante', 'Intermedio', 'Avanzado'],
  },
});

ModuleSchema.index({ place: 1 }, { unique: true });

module.exports = mongoose.model('Module', ModuleSchema);
