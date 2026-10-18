import mongoose from 'mongoose';

/** Per-hour sign-up counters (email / hashed IP). Rows expire on their own. */
const LeadThrottleSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export default mongoose.models.LeadThrottle || mongoose.model('LeadThrottle', LeadThrottleSchema);
