import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditLogWriterService } from './audit-log-writer.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogWriterService],
  exports: [AuditLogWriterService],
})
export class AuditLogWriterModule {}
