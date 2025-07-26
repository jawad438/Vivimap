import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  fullName: string;
  username: string;
  emailVerified: boolean;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  fullName: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  emailVerified: { type: Boolean, default: false },
}, { timestamps: true });

export default model<IUser>('User', UserSchema);
