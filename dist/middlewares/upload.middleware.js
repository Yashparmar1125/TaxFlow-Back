"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMagicBytes = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// @ts-ignore
const file_type_1 = __importDefault(require("file-type"));
const ApiError_1 = require("../utils/ApiError");
const fs_1 = __importDefault(require("fs"));
// Setup multer to store temporarily in memory or disk (using disk here for magic byte checks)
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // generate random string for secure temp name
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}`);
    }
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit
    }
});
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const validateMagicBytes = async (req, res, next) => {
    if (!req.file)
        return next();
    try {
        const type = await file_type_1.default.fromFile(req.file.path);
        if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
            // Clean up invalid file
            fs_1.default.unlinkSync(req.file.path);
            throw new ApiError_1.ApiError(400, 'Invalid file type. File validation failed.');
        }
        // File passed magic bytes validation
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateMagicBytes = validateMagicBytes;
