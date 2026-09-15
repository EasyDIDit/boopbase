import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  productType: {
    type: String,
    required: true,
    enum: ['band', 'card', 'sticker'],
    default: 'band',
  },
  status: {
    type: String,
    required: true,
    enum: ['ready', 'sold', 'claimed', 'disabled'],
    default: 'ready',
  },
  ownerUsername: {
    type: String,
    default: '',
    lowercase: true,
  },
  orderEmail: {
    type: String,
    default: '',
    lowercase: true,
  },
  programmedUrl: {
    type: String,
    default: '',
  },
  scanCount: {
    type: Number,
    default: 0,
  },
  claimedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Device || mongoose.model('Device', DeviceSchema);
