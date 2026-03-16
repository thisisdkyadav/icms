import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  qrCode: {
    type: String  // Unique QR code data
  },
  attended: {
    type: Boolean,
    default: false
  },
  dataFields: {
    type: Map,
    of: String  // For additional CSV fields
  }
}, { timestamps: true });

export default mongoose.model('Participant', participantSchema);
