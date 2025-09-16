import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
    createNote,
    deleteNote,
    getAllNote,
    getNoteById,
    pinNote,
    restoreAllNote,
    restoreNote,
    updateNote,
} from '../controller/note.controller.js';
const router = Router();

router.use(verifyJWT);
router.route('/create-note').post(createNote);
router.route('/get-all-note').get(getAllNote);
router.route('/update-note/:noteId').patch(updateNote);
router.route('/delete-note/:noteId').get(deleteNote);
router.route('/get-single-note/:noteId').get(getNoteById);
router.route('/pin-note/:noteId').get(pinNote);
router.route('/restore-note/:noteId').get(restoreNote);
router.route('/restore-all-note').get(restoreAllNote);
export default router;
