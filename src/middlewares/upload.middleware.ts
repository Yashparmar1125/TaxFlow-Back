import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import fileType from 'file-type'; 
import { ApiError } from '../utils/ApiError';
import fs from 'fs';

// Setup multer to store temporarily in memory or disk (using disk here for magic byte checks)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // generate random string for secure temp name
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  }
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export const validateMagicBytes = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next();

  try {
    const type = await fileType.fromFile(req.file.path);
    
    if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
      // Clean up invalid file
      fs.unlinkSync(req.file.path);
      throw new ApiError(400, 'Invalid file type. File validation failed.');
    }
    
    // File passed magic bytes validation
    next();
  } catch (error) {
    next(error);
  }
};
