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
  /** Store order (Stripe session id) this device was sold under, when provisioned or assigned. */
  orderId: {
    type: String,
    default: '',
  },
  soldAt: { type: Date, default: null },
  /** Per-card setup link. Token = HMAC(secret, orderId.code.salt); only the hash is stored. */
  claimTokenSalt: { type: String, default: '' },
  claimTokenHash: { type: String, default: '', index: true },
  /** Hashes of replaced links, so an old link can still offer "email me a new one". */
  prevTokenHashes: { type: [String], default: [] },
  claimExpiresAt: { type: Date, default: null },
  remindersSent: { type: Number, default: 0 },
  lastLinkSentAt: { type: Date, default: null },
  linkSendsDay: { type: String, default: '' },
  linkSendsCount: { type: Number, default: 0 },
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
