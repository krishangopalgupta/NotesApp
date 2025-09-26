import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
const app = express();

dotenv.config({
    path: './.env',
});

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// routes
import userRouter from './routes/user.routes.js';
import noteRouter from './routes/note.routes.js';

app.use('/api/v1/user', userRouter);
app.use('/api/v1/note', noteRouter);

export { app };
