import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  assignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }],
  certificateTemplate: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
