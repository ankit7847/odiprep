const multer = require("multer");
const ApiError = require("../utils/ApiError");

const ALLOWED = /\.(xlsx|xls|csv)$/i;

// Kept in memory (no disk on Render free tier); 5 MB is thousands of questions
const uploadSheet = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.test(file.originalname)) return cb(new ApiError(400, "Upload an .xlsx, .xls or .csv file"));
    cb(null, true);
  },
}).single("file");

// Turn multer errors (e.g. file too large) into clean 400s
module.exports = (req, res, next) =>
  uploadSheet(req, res, (err) => {
    if (err instanceof multer.MulterError) return next(new ApiError(400, err.code === "LIMIT_FILE_SIZE" ? "File is larger than 5 MB" : err.message));
    next(err);
  });
