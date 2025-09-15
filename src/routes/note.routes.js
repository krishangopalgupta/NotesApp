import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
    createNote,
    deleteNote,
    getAllNote,
    updateNote,
} from '../controller/note.controller.js';
const router = Router();

router.use(verifyJWT);
router.route('/create-note').post(createNote);
router.route('/get-all-note').get(getAllNote);
router.route('/update-note/:noteId').patch(updateNote);
router.route('/delete-note/:noteId').get(deleteNote);
export default router;
