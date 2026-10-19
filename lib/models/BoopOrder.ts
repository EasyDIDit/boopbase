import mongoose from 'mongoose';

/**
 * Sales log. Online sales: written by POST /api/provision (orderId = Stripe session id).
 * In-person sales: written when EASY assigns a card to a buyer on /owner/clients (orderId = inperson-<code>-<time>).
 */
const BoopOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  /** One sales log for both channels. Records without a value read as in_person (safe default). */
  channel: { type: String, enum: ['in_person', 'online'], default: 'in_person' },
  /** In-person: sale or giveaway. Online orders are always 'sale'. '' = not recorded. */
  saleType: { type: String, enum: ['', 'sale', 'giveaway'], default: '' },
  email: { type: String, default: '', lowercase: true, trim: true },
  name: { type: String, default: '' },
  productType: { type: String, enum: ['band', 'card', 'sticker'], default: 'card' },
  quantity: { type: Number, default: 1 },
  livemode: { type: Boolean, default: false },
  /** Codes reserved from ready stock for this order (each has its own setup link on the Device). */
  deviceCodes: { type: [String], default: [] },
  /** Stock cards still owed because stock (of that color) was short at sale. Excludes logo cards (toMake). Owner screen shows these; "Fill" assigns new stock. */
  shortfall: { type: Number, default: 0 },
  /**
   * Per-color lines (online orders). `owed` = cards of that line not yet assigned.
   * custom = logo card printed fresh for this order: never taken from stock; EASY prints + programs, then links it.
   */
  lines: {
    type: [{ _id: false, color: { type: String, default: '' }, quantity: Number, custom: { type: Boolean, default: false }, owed: { type: Number, default: 0 } }],
    default: [],
  },
  /** Logo cards still to print + program + link (sum of owed on custom lines). Not counted in shortfall. */
  toMake: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'boop_orders' });

export default mongoose.models.BoopOrder || mongoose.model('BoopOrder', BoopOrderSchema);
