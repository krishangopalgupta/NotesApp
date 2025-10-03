import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const noteSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        title: {
            type: String,
            index: true,
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
        // tags: [
        //     {
        //         type: String,
        //     },
        // ],
        // new method
        tags: {
            type: [String],
            // set: (tags) => {
            //     return tags.length > 0 ? tags : undefined;
            // },
            index: true,
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        deletedAt: {
            type: Date,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
        isLocked: {
            default: false,
            type: Boolean,
        },
        reminder: {
            type: Date,
            index: true,
        },
        isFavourite: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const Note = mongoose.model('Note', noteSchema);

// tags: {
//   type: [String],
//   set: (tags) => {
//     if (!Array.isArray(tags) || tags.length === 0) return undefined;

//     return tags
//       .map((tag) => tag.trim().toLowerCase()) // normalize
//       .filter((tag) => tag.length > 0); // remove empty strings
//   },
// }
