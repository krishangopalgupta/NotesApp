import { isValidObjectId } from 'mongoose';
import { apiError } from '../utills/apiError.js';
import { asyncHandler } from '../utills/asyncHandler.js';
import { apiResponse } from '../utills/apiResponse.js';
import { Note } from '../models/note.model.js';

const createNote = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content) {
        throw new apiError(400, 'Content is required');
    }
    const note = await Note.create({
        content,
        // 123
        user: req.user,
    });
    res.status(200).json(
        new apiResponse(200, { _id: note?._id }, 'note created successfully')
    );
});

const getNoteById = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    if (!isValidObjectId(noteId)) {
        throw new apiError(409, 'Invalid Note Id');
    }

    const note = await Note.findOne({ _id: noteId, isDeleted: false });
    if (!note) {
        throw new apiError(409, 'Note not found');
    }
    if (req.user?._id.toString() !== note.user?._id.toString()) {
        throw new apiError(401, "You're not authorized to access this note");
    }

    res.status(200).json(
        new apiResponse(200, note, 'Note fetched successfully')
    );
});

const getAllNote = asyncHandler(async (req, res) => {
    // isDeleted: false ignored soft deleted, if i do not give this condition it will also fetch soft deleted notes
    const notes = await Note.find({ user: req.user?._id, isDeleted: false });

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                { notes, totalNotes: notes.length },
                'All notes fetched Successfully'
            )
        );
});

const updateNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    if (!isValidObjectId(noteId)) {
        throw new apiError(409, 'Invalid Note Id');
    }

    const note = await Note.findOne({ _id: noteId, isDeleted: false });
    if (!note) {
        throw new apiError(409, 'Note not found');
    }
    if (req.user?._id.toString() !== note.user?._id.toString()) {
        throw new apiError(401, "You're not authorized to update this note");
    }

    const { content } = req.body;
    const updatedNote = await note.updateOne({
        content: content,
    });

    if (!updatedNote) {
        throw new apiError(404, 'No Note found');
    }
    res.status(200).json(
        new apiResponse(200, updatedNote, 'Note updated Successfully')
    );
});

const deleteNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    if (!isValidObjectId(noteId)) {
        throw new apiError(400, 'Invalid Note Id');
    }

    const note = await Note.findOne({ _id: noteId });
    if (!note) {
        throw new apiError(404, "Note is either deleted or doesn't exist");
    }
    if (req.user?._id.toString() !== note.user?._id.toString()) {
        throw new apiError(403, "You're not authorized to delete this note");
    }

    await note.updateOne({ isDeleted: true });

    res.status(200).json(new apiResponse(200, {}, 'Note deleted Successfully'));
});

// Both pinNote working fine in below i used .save
// const pinNote = asyncHandler(async (req, res) => {
//     const { noteId } = req.params;
//     if (!isValidObjectId(noteId)) {
//         throw new apiError(409, 'Invalid Note Id');
//     }

//     // const pinnedNote = await Note.findByIdAndUpdate(
//     //     { _id: noteId },
//     //     {
//     //         isPinned: !note.isPinned,
//     //     }
//     // );

//     const note = await Note.findById(noteId);
//     if (!note) {
//         throw new apiError(404, 'Note not found');
//     }

//     if (req.user?._id.toString() !== note.user?._id.toString()) {
//         throw new apiError(403, 'You not authorized to access this note');
//     }
//     note.isPinned = !note.isPinned;
//     await note.save({ validateBeforeSave: false });

//     const message = note.isPinned ? 'Pinned' : 'Unpinned';
//     res.status(200).json(
//         new apiResponse(200, {}, `Message ${message} successfully`)
//     );
// });

const pinNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    if (!isValidObjectId(noteId)) {
        throw new apiError(409, 'Invalid Note Id');
    }

    // const note = await Note.findById(noteId);
    const note = await Note.findOne({ noteId, isDeleted: false });

    if (!note) {
        throw new apiError(404, 'Note not found');
    }
    if (note.user?._id.toString() !== req.user?._id.toString()) {
        throw new apiError(400, "You're not authorized");
    }
    const togglePin = await Note.findByIdAndUpdate(
        { _id: noteId },
        {
            isPinned: !note.isPinned,
        },
        { new: true }
    );

    const message = togglePin.isPinned ? 'Pinned' : 'unPinned';
    res.status(200).json(
        new apiResponse(
            200,
            { _id: note?._id, isPinned: togglePin.isPinned },
            `Message ${message} successfully`
        )
    );
});

const restoreNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    if (!isValidObjectId(noteId)) {
        throw new apiError(409, 'Invalid Note Id');
    }

    const note = await Note.findOne({ _id: noteId, isDeleted: true });
    if (!note) {
        throw new apiError(404, 'Note not found');
    }
    if (note.user?._id.toString() !== req.user?._id.toString()) {
        throw new apiError(400, "You're not authorized");
    }

    // note.isDeleted = false;
    await note.updateOne({ isDeleted: false });
    // await note.save({ validateBeforeSave: false });
    res.status(200).json(
        new apiResponse(200, note, 'Note Restored Successfully')
    );
});

const restoreAllNote = asyncHandler(async (req, res) => {
    const deletedNotes = await Note.find({
        user: req.user?._id,
        isDeleted: true,
    });
    if (deletedNotes.length < 1) {
        throw new apiError(404, 'Note not found to restore');
    }

    await Note.updateMany(
        { user: req.user?._id, isDeleted: true },
        {
            $set: {
                isDeleted: false,
            },
        }
    );

    res.status(200).json(
        new apiResponse(
            200,
            {
                restoredNotes: deletedNotes.length,
                note: deletedNotes.map((d) => {
                    return {
                        _id: d?._id,
                        content: d?.content,
                    };
                }),
            },
            'Note Restored Successfully'
        )
    );
});

export {
    createNote,
    getNoteById,
    getAllNote,
    updateNote,
    deleteNote,
    pinNote,
    restoreNote,
    restoreAllNote,
};
