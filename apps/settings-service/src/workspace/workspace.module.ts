import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { WorkspacePackage } from './entities/workspace-package.entity';
import { OrganizationWorkspace } from './entities/organization-workspace.entity';
import { FeatureCatalog } from '../features/entities/feature-catalog.entity';
import { OrganizationFeature } from '../features/entities/organization-feature.entity';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkspacePackage,
      OrganizationWorkspace,
      FeatureCatalog,
      OrganizationFeature,
    ]),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, JwtAuthGuard],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
