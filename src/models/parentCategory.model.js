import mongoose, { Schema } from 'mongoose';

const parentCategorySchema = new Schema(
    {
        parentCategory: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
    },
    { timestamps: true }
);

export const ParentCategory = mongoose.model(
    'ParentCategory',
    parentCategorySchema
);
