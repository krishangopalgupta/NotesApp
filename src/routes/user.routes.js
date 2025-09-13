import { Router } from 'express';
import { getAllUser, getCurrentUser, userlogin, userLogout, userSignup } from '../controller/user.controller.js';
import { upload } from '../middleware/multer.middleware.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
const router = Router();

router.route('/signup').post(upload.single('avatarImage'), userSignup);
router.route('/login').post(userlogin);
router.route('/all-users').get(getAllUser)

// protected routes
router.use(verifyJWT);
router.route('/current-user').get(getCurrentUser);
router.route('/logout').get(userLogout);

export default router;
