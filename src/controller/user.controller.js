import { asyncHandler } from '../utills/asyncHandler.js';
import { apiError } from '../utills/apiError.js';
import { apiResponse } from '../utills/apiResponse.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utills/cloudinary.js';
import bcrypt from 'bcrypt';

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
        .json(new apiResponse(201, user?._id, 'User Created Successfully'));
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



export { userSignup, userlogin, getCurrentUser, userLogout, getAllUser };

// changeCurrentPassword, getCurrentUser, updateAccountDetails, updateAvatarImage


// protect route

// AccessToken has expired After 3600s
// The access token that is stored in our browser check with the database if it is correct? what it will do, it will refreshAccessToken of that user.
// router.route('/video').get(verifyJWT, BengalFiles);