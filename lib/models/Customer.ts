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
  /** lead (sign-up form only) or customer (bought/claimed). Sign-ups never downgrade a customer. Empty on older rows. */
  status: { type: String, enum: ['', 'lead', 'customer'], default: '' },
  name: { type: String, default: '', maxlength: 80 },
  phone: { type: String, default: '', maxlength: 30 },
  interests: { type: [String], default: [] },
  /** Which sign-up button: join-list, band-design. */
  sources: { type: [String], default: [] },
  consentAt: { type: Date },
  consentText: { type: String, default: '' },
  textConsentAt: { type: Date },
  textConsentText: { type: String, default: '' },
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
