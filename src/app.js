import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
const app = express();
import { Note } from './models/note.model.js';
import cron from 'node-cron';

dotenv.config({
    path: './.env',
});

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// test for 2 minutes
cron.schedule("*/2 * * * *", async () => {
  try {
    const result = await Note.deleteMany({
      isDeleted: true,
      deletedAt: { $lte: new Date(Date.now() - 120 * 1000) },
    });
    
    
  } catch (error) {
    console.error("Cron job failed:", error.message);
  }
});

// routes
import userRouter from './routes/user.routes.js';
import noteRouter from './routes/note.routes.js';

app.use('/api/v1/user', userRouter);
app.use('/api/v1/note', noteRouter);

export { app };
