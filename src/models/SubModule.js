const mongoose = require('mongoose');

const SubModuleSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  place: {
    type: Number,
    required: true,
    min: 1,
  },
});

SubModuleSchema.index({ module: 1, place: 1 }, { unique: true });

SubModuleSchema.index({ module: 1 });

module.exports = mongoose.model('SubModule', SubModuleSchema);
