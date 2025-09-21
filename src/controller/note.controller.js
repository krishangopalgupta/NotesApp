import { isValidObjectId } from 'mongoose';
import { apiError } from '../utills/apiError.js';
import { asyncHandler } from '../utills/asyncHandler.js';
import { apiResponse } from '../utills/apiResponse.js';
import { Note } from '../models/note.model.js';

const createNote = asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    if (!content) {
        throw new apiError(400, 'Content is required');
    }
    const note = await Note.create({
        content,
        title,
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
        throw new apiError(400, 'Invalid Note Id');
    }

    const note = await Note.findOne({ _id: noteId, isDeleted: false });
    if (!note) {
        throw new apiError(404, 'Note not found');
    }
    if (req.user?._id.toString() !== note.user?._id.toString()) {
        throw new apiError(403, "You're not authorized to update this note");
    }

    const { content, title } = req.body;
    if (!content) {
        throw new apiResponse(400, 'Content is required');
    }

    const updatedObject = { content };
    // const updatedObject = {};
    // updatedObject.content = content;
    if (title) {
        updatedObject.title = title;
    } else {
        updatedObject.$unset = { title: 1 };
    }

    // console.log(updatedObject)
    const updatedNote = await Note.findByIdAndUpdate(noteId, updatedObject, {
        new: true,
        runValidators: true,
    });

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
    const note = await Note.findOne({ _id: noteId, isDeleted: false });
    if (!note) {
        throw new apiError(404, 'Note not found');
    }
    const togglePin = await Note.findByIdAndUpdate(
        { _id: noteId, user: req.user?._id, isDeleted: false },
        {
            isPinned: !note.isPinned,
        },
        { new: true }
    );

    if (!togglePin) {
        res.status(400, "Note not found or You're not authorized");
    }
    const message = togglePin.isPinned ? 'Pinned' : 'unPinned';
    res.status(200).json(
        new apiResponse(
            200,
            { _id: note?._id, isPinned: togglePin.isPinned },
            `Message ${message} successfully`
        )
    );
});

const allPinnedNote = asyncHandler(async (req, res) => {
    const pinnedNotes = await Note.find({
        user: req.user?._id,
        isPinned: true,
    });
    res.status(200).json(
        new apiResponse(
            200,
            { pinnedNotes, totalPinnedNotes: pinnedNotes.length },
            'All Pinned Note fetched Successfully'
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

const searchNotes = asyncHandler(async (req, res) => {
    const searchQuery = req.query.q;
    if (!searchQuery) {
        throw new apiError(400, 'Search query is required');
    }
    const searchedNotes = await Note.find({
        user: req.user?._id,
        $or: [
            { title: { $regex: searchQuery, $options: 'i' } },
            { content: { $regex: searchQuery, $options: 'i' } },
        ],
        isDeleted: false,
    });

    const searchedNotesLength = searchedNotes.length;
    const message =
        searchedNotesLength > 0
            ? 'Searched Notes fetched Successfully'
            : 'No Notes found';
    res.status(200).json(
        new apiResponse(
            200,
            { totalNotes: searchedNotesLength, notes: searchedNotes },
            message
        )
    );
});

const sortNotes = asyncHandler(async (req, res) => {
    let sortType = req.query.sort.toLowerCase();
    const type = sortType;
    switch (sortType) {
        case 'newest':
            sortType = { createdAt: -1 };
            break;
        case 'oldest':
            sortType = { createdAt: 1 };
            break;
        case 'pinned':
            sortType = { isPinned: -1, createdAt: -1 };
            break;
        default:
            sortType = { createdAt: -1 };
            break;
    }

    const note = await Note.find({
        user: req.user?._id,
        isDeleted: false,
    }).sort(sortType);

    res.status(200).json(
        new apiResponse(200, note, `${type} Notes Sorted Successfully`)
    );
});

const searchingAndSorting = asyncHandler(async (req, res) => {
    let queryParams = req.query.q.toLowerCase();
    const type = queryParams;
    switch (queryParams) {
        case 'newest':
            queryParams = { createdAt: -1 };
            break;
        case 'oldest':
            queryParams = { createdAt: 1 };
            break;
        case 'pinned':
            queryParams = { isPinned: -1, createdAt: -1 };
            break;
        case 'search':
            queryParams = [
                { title: { $regex: queryParams, $options: 'i' } },
                { content: { $regex: queryParams, $options: 'i' } },
            ];
        default:
            queryParams = { createdAt: -1 };
            break;
    }

    let note;
    if (queryParams === 'search') {
        note = await Note.find({
            user: req.user?._id,
            $or: queryParams,
            isDeleted: false,
        });
    } else {
        note = await Note.find({
            user: req.user?._id,
            isDeleted: false,
        }).sort(queryParams);
    }

    res.status(200).json(
        new apiResponse(200, note, `${type} Notes Sorted Successfully`)
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
    searchNotes,
    sortNotes,
    allPinnedNote,
searchingAndSorting,};
