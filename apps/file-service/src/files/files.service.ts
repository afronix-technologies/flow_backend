import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { storageConfig } from '../core/config/storage.config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileResponseDto } from './dto/file-response.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {}

  /**
   * Generate date-based path (YYYY/MM/DD))
   */
  private getDateBasedPath(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Parse metadata safely
   */
  private parseMetadata(metadata: string | null): any {
    if (!metadata) return undefined;
    try {
      return JSON.parse(metadata);
    } catch {
      return metadata; // Return raw value if not valid JSON
    }
  }

  /**
   * Upload one or more files
   */
  async uploadFiles(files: Express.Multer.File[], metadata?: string): Promise<FileResponseDto[]> {
    const uploadedFiles: FileResponseDto[] = [];
    const datePath = this.getDateBasedPath();
    const fullPath = path.join(storageConfig.uploadDir, datePath);

    // Ensure date-based directory exists
    await this.ensureDirectory(fullPath);

    for (const file of files) {
      const fileId = randomUUID();
      const ext = path.extname(file.originalname);
      const filename = `${fileId}${ext}`;
      const filePath = path.join(fullPath, filename);
      const relativePath = `${datePath}/${filename}`;

      // Save file to disk
      await fs.writeFile(filePath, file.buffer);

      // Save metadata to database
      const fileEntity = this.fileRepository.create({
        id: fileId,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: relativePath,
        metadata: metadata || null,
      });

      const savedFile = await this.fileRepository.save(fileEntity);

      // Build response with URL including filename
      uploadedFiles.push({
        id: savedFile.id,
        filename: savedFile.filename,
        originalName: savedFile.originalName,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
        path: savedFile.path,
        url: `${storageConfig.baseUrl}/api/v1/files/${savedFile.id}/${encodeURIComponent(savedFile.originalName)}`,
        uploadedAt: savedFile.uploadedAt, // IMPORTANT: Include upload date
        metadata: this.parseMetadata(savedFile.metadata),
      });
    }

    return uploadedFiles;
  }

  /**
   * Get file by ID
   */
  async getFileById(id: string): Promise<{ file: File; filePath: string }> {
    const file = await this.fileRepository.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const filePath = path.join(storageConfig.uploadDir, file.path);

    // Check if file exists on disk
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('File not found on disk');
    }

    return { file, filePath };
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(id: string): Promise<FileResponseDto> {
    const file = await this.fileRepository.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return {
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      path: file.path,
      url: `${storageConfig.baseUrl}/api/v1/files/${file.id}/${encodeURIComponent(file.originalName)}`,
      uploadedAt: file.uploadedAt, // IMPORTANT: Include upload date
      metadata: this.parseMetadata(file.metadata),
    };
  }

  /**
   * List files with pagination
   */
  async listFiles(
    page: number = 1,
    limit: number = 20,
    mimeType?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ files: FileResponseDto[]; total: number; page: number; limit: number }> {
    const query = this.fileRepository.createQueryBuilder('file');

    if (mimeType) {
      query.andWhere('file.mimeType LIKE :mimeType', { mimeType: `%${mimeType}%` });
    }

    if (startDate) {
      query.andWhere('file.uploadedAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('file.uploadedAt <= :endDate', { endDate });
    }

    const [files, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('file.uploadedAt', 'DESC')
      .getManyAndCount();

    const fileResponses = files.map((file) => ({
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      path: file.path,
      url: `${storageConfig.baseUrl}/api/v1/files/${file.id}/${encodeURIComponent(file.originalName)}`,
      uploadedAt: file.uploadedAt, // IMPORTANT: Include upload date
      metadata: this.parseMetadata(file.metadata),
    }));

    return { files: fileResponses, total, page, limit };
  }

  /**
   * Delete file (soft delete)
   */
  async deleteFile(id: string): Promise<{ success: boolean; message: string }> {
    const file = await this.fileRepository.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Soft delete in database
    await this.fileRepository.softDelete(id);

    // Optionally delete from disk (uncomment if needed)
    // const filePath = path.join(storageConfig.uploadDir, file.path);
    // try {
    //   await fs.unlink(filePath);
    // } catch (error) {
    //   console.error('Error deleting file from disk:', error);
    // }

    return { success: true, message: 'File deleted successfully' };
  }
}
