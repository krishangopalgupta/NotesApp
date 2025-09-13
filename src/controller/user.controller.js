import { asyncHandler } from '../utills/asyncHandler.js';
import { apiError } from '../utills/apiError.js';
import { apiResponse } from '../utills/apiResponse.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utills/cloudinary.js';

const generateAccessAndRefreshToken = async (user) => {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    return { accessToken, refreshToken };
};

const options = {
    httpOnly: true,
    secure: true,
};

const userSignup = asyncHandler(async (req, res) => {
    const { username, email, fullname, password } = req.body;
    if (!username || !email || !fullname || !password) {
        throw new apiError(404, 'All field is required');
    }

    // if([username, email, fullname, password].some((fields) => fields.trim() === "")){
    //     throw new apiError(400, "All field is Required")
    // }

    const isUserAlreadyExist = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (isUserAlreadyExist) {
        throw new apiError(409, 'User Already exists');
    }

    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new apiError(404, 'File Path Is Required');
    }

    const response = await uploadOnCloudinary(avatarLocalPath);
    if (!response) {
        throw new apiError(404, 'Error while Uploading file');
    }

    const user = await User.create({
        username,
        email,
        fullname,
        password,
        avatarImage: response.url,
        publicId: response.public_id,
    });

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const createdUser = await User.findById(user?._id).select(
        '-password -refreshToken'
    );

    return res
        .status(201)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(new apiResponse(200, createdUser, 'User Created Successfully'));
});

export { userSignup };
// login, refreshAccessToken, refreshRefreshToken, logoutUser, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateAvatarImage
