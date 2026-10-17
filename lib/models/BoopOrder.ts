import mongoose from 'mongoose';

/** One store sale, written by POST /api/provision. Idempotent on orderId (Stripe session id). */
const BoopOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, default: '' },
  productType: { type: String, enum: ['band', 'card', 'sticker'], default: 'card' },
  quantity: { type: Number, default: 1 },
  livemode: { type: Boolean, default: false },
  /** Random salt; the claim token is derived from it and BOOPBASE_PROVISION_SECRET. Only the hash is stored. */
  tokenSalt: { type: String, required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  /** Device codes reserved at sale (stock mode only). Usually empty: EASY assigns codes when packing. */
  deviceCodes: { type: [String], default: [] },
  claimedUsername: { type: String, default: '', lowercase: true },
  claimedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'boop_orders' });

export default mongoose.models.BoopOrder || mongoose.model('BoopOrder', BoopOrderSchema);
