import mongoose from 'mongoose';

/** One store sale, written by POST /api/provision. Idempotent on orderId (Stripe session id). */
const BoopOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, default: '' },
  productType: { type: String, enum: ['band', 'card', 'sticker'], default: 'card' },
  quantity: { type: Number, default: 1 },
  livemode: { type: Boolean, default: false },
  /** Codes reserved from ready stock for this order (each has its own setup link on the Device). */
  deviceCodes: { type: [String], default: [] },
  /** Cards still owed because stock was short at sale. Owner screen shows these; "Fill" assigns new stock. */
  shortfall: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'boop_orders' });

export default mongoose.models.BoopOrder || mongoose.model('BoopOrder', BoopOrderSchema);
