import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Project } from './entities/project.entity';
import { ProjectTask } from './entities/project-task.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectsInternalController } from './projects-internal.controller';
import { JwtStrategy } from '../../core/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectTask]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION', '7d') },
      }),
    }),
  ],
  controllers: [ProjectsController, ProjectsInternalController],
  providers: [ProjectsService, JwtStrategy],
})
export class ProjectsModule {}
