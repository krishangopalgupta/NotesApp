import dotenv from 'dotenv';
import express from 'express';
const app = express();

dotenv.config({
    path: './.env',
});

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// protected route
import userRouter from './routes/user.routes.js';
app.use('/api/v1/user', userRouter);

export { app };
