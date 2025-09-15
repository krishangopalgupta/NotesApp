import mongoose, { Schema } from 'mongoose';

const categorySchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        parentCategory: {
            type: Schema.Types.ObjectId,
            ref: 'ParentCategory'
        }
    },
    { timestamps: true }
);

export const Category = mongoose.model('Category', categorySchema);