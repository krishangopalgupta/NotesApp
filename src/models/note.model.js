import mongoose, { Schema } from 'mongoose';

const noteSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        content: {
            type: String,
            required: true,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
        },
        image: {
            type: String,
        },
    },
    { timestamps: true }
);

export const Note = mongoose.model('Note', noteSchema);
