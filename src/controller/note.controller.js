import { isValidObjectId } from 'mongoose';
import { apiError } from '../utills/apiError.js';
import { asyncHandler } from '../utills/asyncHandler.js';
import { apiResponse } from '../utills/apiResponse.js';
import { Note } from '../models/note.model.js';

const createNote = asyncHandler(async (req, res) => {
    const { title, content, tags } = req.body;
    if (!content) {
        throw new apiError(400, 'Content is required');
    }

    // if we don't give tags than it will be an empty array
    const note = await Note.create({
        content,
        title,
        // we can directly use tag because we're using set in our schema
        tags: Array.isArray(tags)
            ? tags.map((t) => t.trim().toLowerCase())
            : tags,

        // otherwise we have to use this
        // tags: tags ? tags : [],
        user: req.user,
    });

    // if we don't want to show tags (even empty array) we can use this method (when don't use set in Schema)
    // const noteData = {
    //     content,
    //     title,
    //     user: req.user?._id,
    // };

    // if(tags && tags.length > 0){
    //     noteData.tags = tags;
    // }

    res.status(200).json(
        new apiResponse(
            200,
            { _id: note?._id, tags: note?.tags },
            'note created successfully'
        )
    );
});

const getNoteById = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    if (!isValidObjectId(noteId)) {
        throw new apiError(409, 'Invalid Note Id');
    }

    const note = await Note.findOne({ _id: noteId, isDeleted: true });
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const notes = await Note.find({ user: req.user?._id, isDeleted: false })
        .sort({ isPinned: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                { totalNotes: notes.length, page, limit, notes },
                'All notes fetched Successfully'
            )
        );
});

const searchingAndSorting = asyncHandler(async (req, res) => {
    const search = req.query.q?.split(',').map((s) => s.trim());
    // .filter(Boolean);
    let sortType = req.query.sortKey?.toLowerCase() || 'newest';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    let sortKey;
    switch (sortType) {
        case 'newest':
            sortKey = { isPinned: -1, createdAt: -1 };
            break;
        case 'oldest':
            sortKey = { createdAt: 1 };
            break;
        case 'pinned':
            // Rule of Sorting
            // Ascending (1): Smaller values first → false (0) before true (1)
            // Descending (-1): Larger values first → true (1) before false (0)
            sortKey = { isPinned: -1, createdAt: -1 };
            break;
        default:
            sortKey = { isPinned: -1, createdAt: -1 };
            break;
    }

    let filter = { user: req.user?._id, isDeleted: false };

    if (search && search.length > 0) {
        filter.$or = [
            { title: { $regex: search.join('|'), $options: 'i' } },
            { content: { $regex: search.join('|'), $options: 'i' } },
            {
                // it also correct
                // tags: {
                //     $regex: Array.isArray(search)
                //         ? search.map((s) => s)
                //         : search,
                //     $options: 'i',
                // },
                tags: { $in: search },
            },
        ];
    }

    const totalNotes = await Note.countDocuments(filter);
    const searchedItem = await Note.find(filter)
        .sort(sortKey)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    let message;
    if (search) {
        message = `searching and sorting of ${search} with ${sortType}`;
    } else {
        message = `${sortType} sorted`;
    }

    res.status(200).json(
        new apiResponse(
            200,
            { totalNotes: totalNotes, page, limit, searchedItem },
            message
        )
    );
});

const updateNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    const { content, title, tags } = req.body;

    if (!isValidObjectId(noteId)) {
        throw new apiError(400, 'Note id is not valid');
    }

    if (
        (content && content?.trim().length === 0) ||
        title?.trim().length === 0
    ) {
        throw new apiError(400, 'fields can not be empty');
    }

    let updatedObject = {};

    if (content) updatedObject.content = content;
    if (tags) updatedObject.tags = tags;
    if (title) updatedObject.title = title;

    const filter = { user: req.user?._id, isDeleted: false, _id: noteId };
    const note = await Note.findOneAndUpdate(filter, updatedObject, {
        new: true,
    });

    if (!note) {
        throw new apiError(404, 'Note not found');
    }
    res.status(200).json(
        new apiResponse(200, { note: note }, 'Note updated Successfully')
    );
});

// const softDelete = asyncHandler(async (req, res) => {
//     const { noteId } = req.params;

//     if (!isValidObjectId(noteId)) {
//         throw new apiError(400, 'Note id is not valid');
//     }
//     const softDelete = await Note.findOneAndUpdate(
//         { _id: noteId, user: req.user?._id, isDeleted: false },
//         {
//             isDeleted: true,
//         },
//         { new: true }
//     );

//     // if (!Note.isDeleted) {
//     //     N.isDeleted = true;
//     //     softDelete.deletedAt = new Date();
//     //     await softDelete.save();
//     // }

//     await Note.deleteMany({
//         isDeleted: true,
//         deletedAt: { $lte: new Date(Date.now() - 120) },
//     });

//     if (!softDelete) {
//         throw new apiError(404, 'Note either deleted or does not exist');
//     }

//     res.status(200).json(
//         new apiResponse(
//             200,
//             {
//                 _id: softDelete._id,
//                 isDeleted: softDelete.isDeleted,
//                 deletedAt: softDelete.deletedAt,
//             },
//             'Message will permanently deleted after 30 days'
//         )
//     );
// });

const softDelete = asyncHandler(async (req, res) => {
    const { noteId } = req.params;

    if (!isValidObjectId(noteId)) {
        throw new apiError(400, 'Note id is not valid');
    }

    const note = await Note.findOne({
        _id: noteId,
        user: req.user?._id,
        isDeleted: false,
    });
    if (!note) {
        throw new apiError(404, 'Note not found or already deleted');
    }

    note.isDeleted = true;
    note.deletedAt = new Date();
    await note.save();

    res.status(200).json(
        new apiResponse(
            200,
            {
                _id: note._id,
                isDeleted: note.isDeleted,
                deletedAt: note.deletedAt,
            },
            'Note moved to Trash. It will be permanently deleted automatically after 30 days.'
        )
    );
});

const getAllSoftDeletedNote = asyncHandler(async (req, res) => {
    const notes = await Note.find({
        user: req.user?._id,
        isDeleted: true,
    }).sort({ deletedAt: -1 });

    res.status(200).json(
        new apiResponse(
            200,
            { totalNotes: notes.length, notes },
            'All soft-deleted notes fetched successfully'
        )
    );
});

const hardDelete = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    if (!isValidObjectId(noteId)) {
        throw new apiError(400, 'Note id is not valid');
    }
    const deletedDocument = await Note.findOneAndDelete(
        {
            isDeleted: true,
            _id: noteId,
            user: req.user?._id,
        },
        { new: true }
    );

    if (!deletedDocument) {
        throw new apiError(404, 'Note not found or not in Trash');
    }

    res.status(200).json(
        new apiResponse(
            200,
            {
                deletedDocument: deletedDocument,
            },
            'Document deleted Successfully'
        )
    );
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

    const totalNumberOfPinnedNotes = await Note.countDocuments({
        user: req.user?._id,
        isPinned: true,
        isDeleted: false,
    });

    console.log(totalNumberOfPinnedNotes);
    if (totalNumberOfPinnedNotes >= 3) {
        throw new apiError(409, 'Maximum Pinned Note achieved');
    }
    const filter = { user: req.user?._id, _id: noteId, isDeleted: false };
    const note = await Note.findOne(filter);

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
        throw new apiError(400, "Note is either deleted or doesn't exist");
    }
    const message = togglePin.isPinned ? 'Pinned' : 'unPinned';

    res.status(200).json(
        new apiResponse(
            200,
            {
                _id: note?._id,
                isPinned: togglePin.isPinned,
            },
            `Message ${message} successfully`
        )
    );
});

const allPinnedNote = asyncHandler(async (req, res) => {
    const filter = { user: req.user?._id, isPinned: true, isDeleted: false };
    const pinnedNotes = await Note.find(filter);
    res.status(200).json(
        new apiResponse(
            200,
            { totalPinnedNotes: pinnedNotes.length, pinnedNotes },
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

export {
    createNote,
    getNoteById,
    getAllNote,
    updateNote,
    softDelete,
    getAllSoftDeletedNote,
    hardDelete,
    pinNote,
    restoreNote,
    restoreAllNote,
    allPinnedNote,
    searchingAndSorting,
};

// const hardDeleteNotesJob = asyncHandler(async( req, res) => {
//     const deletedAfterThirtyDays = Date.now() - 30*24*60*60*1000;
//     const result = await Note.deleteMany({isDeleted: true, deletedAt: {$lt: deletedAfterThirtyDays}});
//     console.log(result, result.deletedCount, "hard deleted Successfully")
// } )
