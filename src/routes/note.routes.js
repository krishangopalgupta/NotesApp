import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
    createNote,
    getAllNote,
    getNoteById,
    pinNote,
    softDelete,
    getAllSoftDeletedNote,
    hardDelete,
    restoreAllNote,
    restoreNote,
    updateNote,
    toggleArchieve,
    lockNotes,
} from '../controller/note.controller.js';
const router = Router();

router.use(verifyJWT);
router.route('/create-note').post(createNote);
router.route('/get-all-note').get(getAllNote);
router.route('/update-note/:noteId').patch(updateNote);
router.route('/soft-delete/:noteId').patch(softDelete);
router.route('/get-all-soft-deleted-notes').get(getAllSoftDeletedNote);
router.route('/hard-delete/:noteId').get(hardDelete);
router.route('/get-single-note/:noteId').get(getNoteById);
router.route('/pin-note/:noteId').patch(pinNote);
router.route('/restore-note/:noteId').patch(restoreNote);
router.route('/restore-all-note').get(restoreAllNote);
router.route('/toggle-archieve/:noteId').patch(toggleArchieve);
router.route('/lock-note/:noteId').post(lockNotes);
export default router;