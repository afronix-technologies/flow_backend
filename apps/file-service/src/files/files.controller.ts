import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFiles,
  UseInterceptors,
  Res,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FilesService } from './files.service';
import { UploadResponseDto, FileResponseDto } from './dto/file-response.dto';
import * as fs from 'fs';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Post('upload')
  @ApiOperation({ summary: 'Upload one or more files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        metadata: {
          type: 'string',
          description: 'Optional JSON metadata string',
          example: '{"source": "bing", "category": "image"}',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully', type: UploadResponseDto })
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files at once
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('metadata') metadata?: string,
  ): Promise<UploadResponseDto> {
    console.log('Upload request received');
    console.log('Files:', files ? files.map((f) => f.originalname) : 'None');
    console.log('Metadata:', metadata);

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (metadata) {
      try {
        JSON.parse(metadata);
      } catch (error) {
        throw new BadRequestException(
          'Metadata must be a valid JSON string. Example: {"key": "value"}',
        );
      }
    }

    try {
      const uploadedFiles = await this.filesService.uploadFiles(files, metadata);

      return {
        success: true,
        files: uploadedFiles,
      };
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  }

  @Get(':id/:filename')
  @ApiOperation({ summary: 'Download a file by ID with filename' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  async downloadFile(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    console.log(`[FileService] Download request - ID: ${id}, Filename: ${filename}`);

    try {
      const { file, filePath } = await this.filesService.getFileById(id);
      console.log(`[FileService] File found: ${filePath}`);

      // Set headers for file download
      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${file.originalName}"`,
        'Content-Length': file.size.toString(),
        'X-Upload-Date': file.uploadedAt.toISOString(),
      });

      // Stream file to response
      const fileStream = fs.createReadStream(filePath);
      return new StreamableFile(fileStream);
    } catch (error) {
      console.error(`[FileService] Error downloading file ${id}:`, error);
      throw error;
    }
  }

  @Get(':id/metadata')
  @ApiOperation({ summary: 'Get file metadata without downloading' })
  @ApiResponse({ status: 200, description: 'File metadata retrieved', type: FileResponseDto })
  async getFileMetadata(@Param('id') id: string): Promise<FileResponseDto> {
    return this.filesService.getFileMetadata(id);
  }

  @Get()
  @ApiOperation({ summary: 'List files with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'mimeType', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async listFiles(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('mimeType') mimeType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.filesService.listFiles(
      page ? parseInt(String(page)) : 1,
      limit ? parseInt(String(limit)) : 20,
      mimeType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async deleteFile(@Param('id') id: string) {
    return this.filesService.deleteFile(id);
  }
}
