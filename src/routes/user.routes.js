import { Router } from 'express';
import { userSignup } from '../controller/user.controller.js';
import { upload } from '../middleware/multer.middleware.js';
const router = Router();

router.route('/signup').post(upload.single('avatarImage'), userSignup);

export default router;