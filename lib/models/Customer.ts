import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  username: {
    type: String,
    default: '',
    lowercase: true,
    trim: true,
  },
  /** Customer asked not to be contacted. Upserts never change it; nothing reads it to send yet. */
  marketingOptOut: {
    type: Boolean,
    default: false,
  },
  /** Where we first got this email: signup, claim, online_order, in_person_sale. */
  source: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
