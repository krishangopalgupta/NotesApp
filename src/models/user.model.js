import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
    {
        // username: {
        //     type: String,
        //     required: true,
        //     trim: true,
        //     index: true,
        // },
        // fullname: {
        //     type: String,
        //     required: true,
        //     trim: true,
        // },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
            // required: true
        },
        avatarImage: {
            type: String,
            // required: true,
        },
        publicId: {
            type: String,
        },
    },
    { timeStamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    return next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    const result = await bcrypt.compare(password, this.password);
    return result;
};

// jwt.sign(payload, secret_key, expiry)
userSchema.methods.generateAccessToken = async function () {
    const accessToken = jwt.sign(
        {
            _id: this._id,
            username: this._username,
            fullname: this._fullname,
        },
        process.env.ACCESS_TOKEN_SECRET_KEY,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
    return accessToken;
};

userSchema.methods.generateRefreshToken = function () {
    const refreshToken = jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET_KEY,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
    return refreshToken;
};

export const User = mongoose.model('User', userSchema);
