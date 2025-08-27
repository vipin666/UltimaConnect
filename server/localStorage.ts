import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${randomUUID()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and document files are allowed'));
    }
  }
});

export class LocalStorageService {
  constructor() {}

  getUploadsDir(): string {
    return uploadsDir;
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    // File is already saved by multer, just return the path
    return `/uploads/${file.filename}`;
  }

  async getFileUrl(filename: string): Promise<string> {
    return `/uploads/${filename}`;
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async listFiles(): Promise<string[]> {
    try {
      return fs.readdirSync(uploadsDir);
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }
}

// Middleware to serve uploaded files
export function serveUploads(app: any) {
  app.use('/uploads', (req: any, res: any, next: any) => {
    // Basic security - only allow access to files in uploads directory
    const filePath = path.join(uploadsDir, req.path);
    const normalizedPath = path.normalize(filePath);
    
    if (!normalizedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(normalizedPath);
  });
}
