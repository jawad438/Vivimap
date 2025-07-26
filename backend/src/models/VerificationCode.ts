import { Schema, model, Document } from 'mongoose';

interface IVerificationCode extends Document {
    email: string;
    code: string;
    expiresAt: Date;
}

const VerificationCodeSchema = new Schema<IVerificationCode>({
    email: { type: String, required: true, lowercase: true, trim: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: '5m' }, // TTL index: auto-deletes after 5 minutes
});

export default model<IVerificationCode>('VerificationCode', VerificationCodeSchema);
