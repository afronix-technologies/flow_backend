import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProjectStatsResponse } from './dto/project-stats.response';
import { Project, ProjectCategory } from './entities/project.entity';
import { ProjectTask } from './entities/project-task.entity';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { CurrentOrg } from '../../core/decorators/current-org.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { AuditActor } from './projects.service';

function actorFrom(user: any, req: Request): AuditActor {
  return {
    userId: user?.userId,
    email: user?.email,
    ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || undefined,
    userAgent: req.headers['user-agent'],
  };
}

@ApiTags('Projects')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ---------------------------------------------------------------------------
  // Stats — declared before /:projectId to avoid route conflict
  // ---------------------------------------------------------------------------

  @Get('stats')
  @ApiOperation({
    summary: 'Project dashboard stats',
    description: 'Returns aggregate counts by status, health, and category for the organization',
  })
  @ApiParam({ name: 'orgId', description: 'Organization ID', type: String })
  @ApiOkResponse({ type: ProjectStatsResponse })
  getStats(@CurrentOrg() orgId: string) {
    return this.projectsService.getStats(orgId);
  }

  // ---------------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------------

  @Get()
  @ApiOperation({
    summary: 'List all projects',
    description:
      'Returns all projects for the organization. Filter by category to split Billable vs Internal.',
  })
  @ApiParam({ name: 'orgId', description: 'Organization ID', type: String })
  @ApiQuery({
    name: 'category',
    enum: ProjectCategory,
    required: false,
    description: 'Filter by Billable or Internal',
  })
  @ApiOkResponse({ type: [Project] })
  findAll(@CurrentOrg() orgId: string, @Query('category') category?: ProjectCategory) {
    return this.projectsService.findAllProjects(orgId, category);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a project',
    description: 'projectCode must be unique within the organization.',
  })
  @ApiParam({ name: 'orgId', description: 'Organization ID', type: String })
  @ApiCreatedResponse({ type: Project })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Project code already exists in this organization' })
  create(
    @CurrentOrg() orgId: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.projectsService.createProject(orgId, dto, actorFrom(user, req));
  }

  @Get(':projectId')
  @ApiOperation({
    summary: 'Get project details',
    description: 'Returns the full project including its tasks array.',
  })
  @ApiParam({ name: 'orgId', description: 'Organization ID', type: String })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: String })
  @ApiOkResponse({ type: Project })
  @ApiNotFoundResponse({ description: 'Project not found' })
  findOne(@CurrentOrg() orgId: string, @Param('projectId') projectId: string) {
    return this.projectsService.findOneProject(orgId, projectId);
  }

  @Patch(':projectId')
  @ApiOperation({
    summary: 'Update a project',
    description: 'Partial update — send only the fields you want to change.',
  })
  @ApiParam({ name: 'orgId', description: 'Organization ID', type: String })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: String })
  @ApiOkResponse({ type: Project })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiConflictResponse({ description: 'Project code already taken' })
  update(
    @CurrentOrg() orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.projectsService.updateProject(orgId, projectId, dto, actorFrom(user, req));
  }

  @Delete(':projectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'owner')
  @ApiOperation({
    summary: 'Delete a project',
    description: 'Permanently removes the project and all its tasks. Admin/owner only.',
  })
  @ApiParam({ name: 'orgId', description: 'Organization ID', type: String })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: String })
  @ApiNoContentResponse({ description: 'Project deleted' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiForbiddenResponse({ description: 'Admin or owner role required' })
  remove(
    @CurrentOrg() orgId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.projectsService.deleteProject(orgId, projectId, actorFrom(user, req));
  }

  // ---------------------------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------------------------

  @Get(':projectId/tasks')
  @ApiOperation({ summary: 'List all tasks for a project' })
  @ApiParam({ name: 'orgId', description: 'Organization ID', type: String })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: String })
  @ApiOkResponse({ type: [ProjectTask] })
  @ApiNotFoundResponse({ description: 'Project not found' })
  findAllTasks(@CurrentOrg() orgId: string, @Param('projectId') projectId: string) {
    return this.projectsService.findAllTasks(orgId, projectId);
  }

  @Post(':projectId/tasks')
  @ApiOperation({ summary: 'Create a task within a project' })
  @ApiParam({ name: 'orgId', description: 'Organization ID', type: String })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: String })
  @ApiCreatedResponse({ type: ProjectTask })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  createTask(
    @CurrentOrg() orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.projectsService.createTask(orgId, projectId, dto, actorFrom(user, req));
  }

  @Get(':projectId/tasks/:taskId')
  @ApiOperation({ summary: 'Get a specific task' })
  @ApiParam({ name: 'orgId', description: 'Organization ID', type: String })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: String })
  @ApiParam({ name: 'taskId', description: 'Task ID', type: String })
  @ApiOkResponse({ type: ProjectTask })
  @ApiNotFoundResponse({ description: 'Task not found' })
  findOneTask(
    @CurrentOrg() orgId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.projectsService.findOneTask(orgId, projectId, taskId);
  }

  @Patch(':projectId/tasks/:taskId')
  @ApiOperation({
    summary: 'Update a task',
    description: 'Partial update — send only the fields you want to change.',
  })
  @ApiParam({ name: 'orgId', description: 'Organization ID', type: String })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: String })
  @ApiParam({ name: 'taskId', description: 'Task ID', type: String })
  @ApiOkResponse({ type: ProjectTask })
  @ApiNotFoundResponse({ description: 'Task not found' })
  updateTask(
    @CurrentOrg() orgId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.projectsService.updateTask(orgId, projectId, taskId, dto, actorFrom(user, req));
  }

  @Delete(':projectId/tasks/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'orgId', description: 'Organization ID', type: String })
  @ApiParam({ name: 'projectId', description: 'Project ID', type: String })
  @ApiParam({ name: 'taskId', description: 'Task ID', type: String })
  @ApiNoContentResponse({ description: 'Task deleted' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  removeTask(
    @CurrentOrg() orgId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.projectsService.deleteTask(orgId, projectId, taskId, actorFrom(user, req));
  }
}
