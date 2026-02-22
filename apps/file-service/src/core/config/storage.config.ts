export const storageConfig = {
  // Base upload directory
  uploadDir: process.env.UPLOAD_DIR || './uploads',

  // Max file size (500MB default)
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '524288000'),

  // Allowed MIME types (empty = all allowed)
  allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(',') || [],

  // Base URL for file access
  baseUrl: process.env.BASE_URL || 'http://localhost:3004',
};
