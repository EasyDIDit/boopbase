import mongoose from 'mongoose';

/**
 * Short-lived counters for login / sign-up / password-reset rate limits and analytics de-dupe.
 * New collection (additive). Rows delete themselves via the TTL index on expiresAt.
 * Keys never hold a raw IP or email: both are hashed (see lib/rateLimit.ts).
 */
const RateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export default mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema);
