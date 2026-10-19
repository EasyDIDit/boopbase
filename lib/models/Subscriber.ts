import mongoose from 'mongoose';

/**
 * Boop mailing list (EASY, Oct 18 2026). Separate from Customer on purpose.
 * Sign-ups come from the store form (/api/leads). Buyers and card claimers are added with isCustomer=true so EASY can
 * send gifts; they only have marketing consent if they opted in (consentAt set). No consent → flagged on the owner page.
 */
const SubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    name: { type: String, default: '', maxlength: 80 },
    phone: { type: String, default: '', maxlength: 30 },
    interests: { type: [String], default: [] },
    /** join-list, band-design (store form), purchase, claim, in_person (added as a customer). */
    sources: { type: [String], default: [] },
    /** Email marketing consent. Null = never opted in (e.g. a buyer who didn't use the form). */
    consentAt: { type: Date, default: null },
    consentText: { type: String, default: '' },
    textConsentAt: { type: Date, default: null },
    textConsentText: { type: String, default: '' },
    /** Bought or claimed a Boop. Never set back to false by a sign-up. */
    isCustomer: { type: Boolean, default: false },
    customerSince: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Subscriber || mongoose.model('Subscriber', SubscriberSchema);
