const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema(
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
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
      unique: true,
    },
    subModules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubModule',
      },
    ],
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Module', ModuleSchema);
