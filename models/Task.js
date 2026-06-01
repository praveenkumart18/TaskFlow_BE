const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    assignments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        status: {
          type: String,
          enum: ['Draft', 'Open', 'In Progress', 'On Hold', 'In Review', 'Completed', 'Cancelled', 'Achieved'],
          default: 'Draft'
        }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        message: {
          type: String,
          required: [true, 'Message is required'],
          trim: true,
          maxlength: [1000, 'Message cannot exceed 1000 characters']
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

taskSchema.index({ 'assignments.user': 1 });

module.exports = mongoose.model('Task', taskSchema);
