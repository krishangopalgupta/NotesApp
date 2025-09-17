import mongoose, { Schema } from 'mongoose';

const noteSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        title: {
            type: String,
        },
        content: {
            type: String,
            required: true,
        },
        image: {
            type: String,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
        },
        tags: [
            {
                type: String,
            },
        ],
        isPinned: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        reminder: {
            type: Date,
        },
    },
    { timestamps: true }
);

export const Note = mongoose.model('Note', noteSchema);
