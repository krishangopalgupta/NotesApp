import { Router } from 'express';
import {
    getAllUser,
    getCurrentUser,
    userlogin,
    userLogout,
    userSignup,
    refreshAccessToken,
    updateAvatarImage,
    changeCurrentPassword,
    updateAccountDetails,
} from '../controller/user.controller.js';
import { upload } from '../middleware/multer.middleware.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
const router = Router();

router.route('/signup').post(upload.single('avatarImage'), userSignup);
router.route('/login').post(userlogin);
router.route('/all-users').get(getAllUser);

// protected routes
router.use(verifyJWT);
router.route('/current-user').get(getCurrentUser);
router.route('/logout').get(userLogout);
router.route('/refresh-access-token').get(refreshAccessToken);
router
    .route('/update-avatar/:userId')
    .post(upload.single('avatarImage'), updateAvatarImage);
router.route('/update-password/:userId').patch(changeCurrentPassword);
router.route('/update-account-details/:userId').patch(updateAccountDetails);
export default router;  
