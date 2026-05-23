import { Controller, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';

@ApiExcludeController()
@Controller('internal/organizations/:orgId/seed-projects')
export class ProjectsInternalController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  seedDefaults(@Param('orgId') orgId: string) {
    return this.projectsService.seedDefaultProjects(orgId);
  }
}
