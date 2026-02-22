import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  path: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  uploadedAt: Date; // IMPORTANT: Include upload date

  @ApiProperty({ required: false })
  metadata?: any;
}

export class UploadResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [FileResponseDto] })
  files: FileResponseDto[];
}
