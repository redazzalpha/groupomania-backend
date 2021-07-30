const multer = require('multer');

const MIME_TYPES = {
    "image/png" : "png",
    "image/jpeg" : "jpg",
    "image/jpg" : "jpg",
}
;
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'img');
    },
    filename: function (req, file, cb) {
        const filename = file.originalname.split(" ").join("_");
        const ext = MIME_TYPES[file.mimetype];
        cb(null, `${filename}-${Date.now()}.${ext}`);
    }
});
   
module.exports = multer({ storage: storage }).single("image");
  