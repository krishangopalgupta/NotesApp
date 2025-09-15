import { asyncHandler } from '../utills/asyncHandler.js';
import { apiError } from '../utills/apiError.js';
import { apiResponse } from '../utills/apiResponse.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utills/cloudinary.js';
import { deletePreviousImageFromCloudinary } from '../utills/cloudinary.js';
import jwt from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';
import { response } from 'express';

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

    return res
        .status(201)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new apiResponse(
                201,
                { _id: user?._id },
                'User Created Successfully'
            )
        );
});

const userlogin = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    if (!email && !username) {
        throw new apiError(404, 'username or emailId is required');
    }

    if (!password) {
        throw new apiError(404, 'All field are mandatory');
    }

    const user = await User.findOne({
        $or: [{ username }, { password }],
    });
    if (!user) {
        throw new apiError(404, 'User Not Found');
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new apiError(409, 'Invalid Credential');
    }

    const { refreshToken, accessToken } =
        await generateAccessAndRefreshToken(user);

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .cookie('refreshToken', refreshToken, options)
        .cookie('accessToken', accessToken, options)
        .json(
            new apiResponse(
                200,
                { _id: user?._id },
                'User LoggedIn Successfully'
            )
        );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new apiResponse(200, req.user, 'Current LoggedIn User'));
});

const userLogout = asyncHandler(async (req, res) => {
    const user = req.user;
    await user.updateOne(
        {
            $unset: {
                refreshToken: 1,
            },
        },
        { new: true }
    );
    res.status(200)
        .clearCookie('refreshToken', options)
        .clearCookie('accessToken', options)
        .json(new apiResponse(200, null, 'User LoggedOut Successfully'));
});

const getAllUser = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-refreshToken -password');
    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                { users, totalUsers: users.length },
                'All Users'
            )
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const browserStoreRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;
    if (!browserStoreRefreshToken) {
        throw new apiError(409, 'Cookie is not present in browser');
    }

    // Me User ko req.user se bhi le skta tha lekin mene refreshToken nhi dala hai req.user me during in verifyJWT file
    const decodedToken = jwt.verify(
        browserStoreRefreshToken,
        process.env.REFRESH_TOKEN_SECRET_KEY
    );
    const user = await User.findById(decodedToken?._id);

    if (browserStoreRefreshToken !== user.refreshToken) {
        throw new apiError(409, 'Invalid Refresh Token');
    }

    const { refreshToken, accessToken } =
        await generateAccessAndRefreshToken(user);

    res.status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new apiResponse(200, null, 'Access Token Refreshed Successfully')
        );
});

const updateAvatarImage = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const localFilePath = req.file?.path;
    if (!localFilePath) {
        throw new apiError(404, 'Avatar Local file path not found');
    }

    const user = await User.findOne({ _id: userId });
    if (req.user?._id.toString() !== user?._id.toString()) {
        throw new apiError(409, 'You are not authorized to update this avatar');
    }

    const publicId = user.publicId;

    const response = await uploadOnCloudinary(localFilePath);
    if (!response) {
        throw new apiError(404, 'Error while Uploading file on cloudinary');
    }

    if (!user) {
        throw new apiError(404, 'User not found');
    }

    await user.updateOne(
        {
            $set: {
                avatarImage: response.url,
                publicId: response.public_id,
            },
        },
        { new: true }
    );

    await deletePreviousImageFromCloudinary(publicId);
    res.status(200).json(
        new apiResponse(200, {}, 'Avatar Image Updated Successfully')
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
        throw new apiError(401, 'Not valid Object Id');
    }

    const { oldPassword, newPassword } = req.body;
    console.log(oldPassword, newPassword);
    if (!userId) {
        throw new apiError(404, 'Please Login');
    }

    if (req.user?._id.toString() !== userId.toString()) {
        throw new apiError(409, 'You are not authorized to change password');
    }

    const user = await User.findOne({ _id: userId });
    console.log(user);
    if (!user) {
        throw new apiError(404, 'user not found');
    }
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
        throw new apiError(409, 'Wrong old Password');
    }

    user.password = newPassword;
    user.save({ validateBeforeSave: false });

    res.status(200).json(
        new apiResponse(200, {}, 'Password Updated Successfully')
    );
});

// need to complete
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
        throw new apiError(401, 'Not valid Object Id');
    }

    const { username, fullname } = req.body;
    if (username) {
        const isAlreadyExistUsername = await User.findOne({ username });
        console.log(isAlreadyExistUsername);

        if (isAlreadyExistUsername) {
            throw new apiError(
                409,
                'Kindly take another username as it is already exist'
            );
        }

        user.username = username;
    }

    const user = await User.findOne({ _id: userId });
    if (!user) {
        throw new apiError(404, 'User Not found');
    }

    if (fullname) {
        user.fullname = fullname;
    }
    await user.save({ validateBeforeSave: false });

    res.status(200).json(
        new apiResponse(200, { _id: user?._id }, 'Details updated Successfully')
    );
});

export {
    userSignup,
    userlogin,
    getCurrentUser,
    userLogout,
    getAllUser,
    refreshAccessToken,
    updateAvatarImage,
    changeCurrentPassword,
    updateAccountDetails,
};