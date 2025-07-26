
import { Schema, model, Document } from 'mongoose';

type MemoryFileType = 'image' | 'video' | 'audio';

interface IMemoryFile {
    name: string;
    type: MemoryFileType;
}

interface IMemoryAuthor {
    _id: Schema.Types.ObjectId;
    username: string;
}

export interface IMemory extends Document {
    position: [number, number]; // [lat, lng]
    title: string;
    description: string;
    files: IMemoryFile[];
    author: IMemoryAuthor | Schema.Types.ObjectId;
}

const MemoryFileSchema = new Schema<IMemoryFile>({
    name: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'audio'], required: true },
}, { _id: false });

const MemorySchema = new Schema<IMemory>({
    position: {
        type: [Number],
        required: true,
        validate: (v: number[]) => Array.isArray(v) && v.length === 2,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    files: [MemoryFileSchema],
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
    timestamps: true
});

export default model<IMemory>('Memory', MemorySchema);
