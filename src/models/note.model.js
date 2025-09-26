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
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
        reminder: {
            type: Date,
        },
    },
    { timestamps: true }
);

export const Note = mongoose.model('Note', noteSchema);

noteSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 120 });

// tags: {
//   type: [String],
//   set: (tags) => {
//     if (!Array.isArray(tags) || tags.length === 0) return undefined;

//     return tags
//       .map((tag) => tag.trim().toLowerCase()) // normalize
//       .filter((tag) => tag.length > 0); // remove empty strings
//   },
// }
