import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  name?: string;
  bio?: string;
  profileImage?: string;
  backgroundImage?: string;
  themeId?: string;
  outerBackgroundColor?: string;
  useOuterBackgroundColor?: boolean;
  innerBackgroundColor?: string;
  useThemeBackground?: boolean;
  links?: any[];
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  views?: number;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  name: { type: String, default: '' },
  bio: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  backgroundImage: { type: String, default: '' },

  themeId: { type: String, default: 'boop-classic' },

  outerBackgroundColor: { type: String, default: '#C4CFDA' },
  useOuterBackgroundColor: { type: Boolean, default: true },

  innerBackgroundColor: { type: String, default: '#ffffff' },
  useThemeBackground: { type: Boolean, default: false },

  links: { type: Array, default: [] },

  instagram: { type: String, default: '' },
  tiktok: { type: String, default: '' },
  youtube: { type: String, default: '' },
  facebook: { type: String, default: '' },

  views: { type: Number, default: 0 },
}, { timestamps: true });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;