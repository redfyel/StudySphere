const multer = require('multer');

// Define the storage strategy
const storage = multer.memoryStorage();

// Create the upload middleware instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024, 
    },
    fileFilter: (req, file, cb) => {
        // Accept only PDF files
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
});

// Export the configured middleware
module.exports = upload;
