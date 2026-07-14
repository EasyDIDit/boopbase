import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  bio: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  backgroundImage: { type: String, default: '' },
  backgroundColor: { type: String, default: '#0a0a0a' },   // ← This was missing
  buttonStyle: { type: String, default: 'solid' },
  links: [{
    id: { type: String },
    title: { type: String },
    url: { type: String },
    isActive: { type: Boolean, default: true },
    clicks: { type: Number, default: 0 }
  }],
  instagram: { type: String, default: '' },
  tiktok: { type: String, default: '' },
  youtube: { type: String, default: '' },
  facebook: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  company: { type: String, default: '' },
  title: { type: String, default: '' },
  address: { type: String, default: '' },
  password: { type: String, required: true },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);