import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        // below is used to create unique file name
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        // cb(null, file.fieldname + '-' + uniqueSuffix);
        cb(null, file.originalname);
    },
});

// console.log(`this is storage in multer.middleware.js, ${storage}`);
// console.log(`this is storage filename in multer.middleware.js, ${storage.filename}`);

export const upload = multer({storage});
