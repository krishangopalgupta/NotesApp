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
    searchNotes,
    updateNote,
} from '../controller/note.controller.js';
const router = Router();

router.use(verifyJWT);
router.route('/create-note').post(createNote);
router.route('/get-all-note').get(getAllNote);
router.route('/update-note/:noteId').patch(updateNote);
router.route('/delete-note/:noteId').patch(deleteNote);
router.route('/get-single-note/:noteId').get(getNoteById);
router.route('/pin-note/:noteId').patch(pinNote);
router.route('/restore-note/:noteId').patch(restoreNote);
router.route('/restore-all-note').get(restoreAllNote);
router.route('/search-notes').get(searchNotes);
export default router;
