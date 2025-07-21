const multer = require('multer');
const path = require('path');

// Set up storage engine for multer
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
const upload = multer({
    storage: storage,
    limits:{fileSize: 1000000}, // 1MB limit
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('myImage'); // 'myImage' is the field name from the form

// Check File Type
function checkFileType(file, cb){
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null,true);
    } else {
        cb('Error: Images Only!');
    }
}

// @desc    Upload an image
// @route   POST /api/uploads
exports.uploadFile = (req, res) => {
    upload(req, res, (err) => {
        if(err){
            res.status(400).json({ msg: err });
        } else {
            if(req.file == undefined){
                res.status(400).json({ msg: 'Error: No File Selected!' });
            } else {
                res.status(200).json({
                    msg: 'File Uploaded!',
                    file: `uploads/${req.file.filename}`
                });
            }
        }
    });
};