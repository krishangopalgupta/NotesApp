import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utills/asyncHandler.js';
import { apiError } from '../utills/apiError.js';
import { User } from '../models/user.model.js';

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header('Authorization').replace('Bearer ', '');
        if (!token) {
            throw new apiError(404, 'Token is Not found');
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET_KEY
        );

        const user = await User.findById(decodedToken).select('-refreshToken');

        if (!user) {
            throw new apiError(404, 'User is Not Authorized');
        }
        req.user = user;
        next();
    } catch (error) {
        throw new apiError(404, 'Invalid Access Token');
    }
});

export { verifyJWT };
