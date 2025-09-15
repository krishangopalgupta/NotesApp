import { isValidObjectId } from 'mongoose';
import { apiError } from '../utills/apiError.js';
import { asyncHandler } from '../utills/asyncHandler.js';
import { apiResponse } from '../utills/apiResponse.js';
import { Note } from '../models/note.model.js';

const createNote = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content) {
        throw new apiError(404, 'Content is required');
    }

    await Note.create({
        content,
        user: req.user,
    });
    res.status(200).json(new apiResponse(200, {}, 'note created successfully'));
});

const getAllNote = asyncHandler(async (req, res) => {
    const notes = await Note.find({});
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

    const note = await Note.findOne({ _id: noteId });
    if (!note) {
        throw new apiError(409, 'Note not found');
    }
    if (req.user?._id.toString() !== note.user?._id.toString()) {
        throw new apiError(401, "You're not authorized to update this note");
    }

    const { content } = req.body;
    await note.updateOne({ content: content });

    res.status(200).json(new apiResponse(200, {}, 'Note updated Successfully'));
});

const deleteNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    if (!isValidObjectId(noteId)) {
        throw new apiError(409, 'Invalid Note Id');
    }

    const note = await Note.findOne({ _id: noteId });
    if (!note) {
        throw new apiError(404, "Note is either deleted or doesn't exist");
    }
    if (req.user?._id.toString() !== note.user?._id.toString()) {
        throw new apiError(409, "You're not authorized to delete this note");
    }

    await note.deleteOne({noteId});
    
    res.status(200).json(new apiResponse(200, {}, 'Note deleted Successfully'));
});

export { createNote, getAllNote, updateNote, deleteNote };