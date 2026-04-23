import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NavigationItem } from './entities/navigation-item.entity';
import { NavigationRoleOverride } from './entities/navigation-role-override.entity';
import { NavigationService } from './navigation.service';
import { NavigationController } from './navigation.controller';
import { FeaturesModule } from '../features/features.module';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { SystemKeyGuard } from './guards/system-key.guard';

@Module({
  imports: [TypeOrmModule.forFeature([NavigationItem, NavigationRoleOverride]), FeaturesModule],
  controllers: [NavigationController],
  providers: [NavigationService, JwtAuthGuard, SuperAdminGuard, SystemKeyGuard],
})
export class NavigationModule {}
