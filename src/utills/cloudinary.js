import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

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



export { uploadOnCloudinary };
