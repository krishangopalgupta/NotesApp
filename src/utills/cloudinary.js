import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { asyncHandler } from '../utills/asyncHandler.js';
import { apiError } from '../utills/apiError.js';

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

const uploadOnCloudinary = async function (localFilePath) {
    try {
        if (!localFilePath) return null;
        const file = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });
        fs.unlinkSync(localFilePath);
        return file;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
};

const deletePreviousImageFromCloudinary = async (publicId) => {
    try {
        // console.log(publicId);
        const { result } = await cloudinary.uploader.destroy(publicId);
        // console.log(result);
        if (result !== 'ok') {
            throw new apiError(
                401,
                'Error while deleting previous avatar from cloudinary'
            );
        }
    } catch (error) {
        throw new apiError(error, error.message);
    }
};

export { uploadOnCloudinary, deletePreviousImageFromCloudinary };
