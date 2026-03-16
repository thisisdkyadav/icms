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
  phone: {
    type: String
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  qrCode: {
    type: String
  },
  attended: {
    type: Boolean,
    default: false
  },
  // Payment details
  transactionId: {
    type: String
  },
  transactionTime: {
    type: String
  },
  amount: {
    type: String
  },
  paymentMode: {
    type: String
  },
  receiptSent: {
    type: Boolean,
    default: false
  },
  // Additional fields from CSV
  dataFields: {
    type: Map,
    of: String
  }
}, { timestamps: true });

export default mongoose.model('Participant', participantSchema);
