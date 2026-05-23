import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';

@ApiTags('System')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({
    summary: 'API index',
    description: 'Returns service info and all available endpoint groups',
  })
  index() {
    return {
      service: 'Flow API',
      version: '1.0',
      status: 'ok',
      docs: '/api/docs/api',
      endpoints: {
        projects: {
          description: 'Project management — list, create, update, archive projects',
          shorthand: '/api/v1/projects',
          full: '/api/v1/organizations/:orgId/projects',
          methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        },
        tasks: {
          description: 'Task management — nested under a project',
          shorthand: '/api/v1/projects/:projectId/tasks',
          full: '/api/v1/organizations/:orgId/projects/:projectId/tasks',
          methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        },
        stats: {
          description: 'Aggregate project dashboard metrics',
          shorthand: '/api/v1/projects/stats',
          full: '/api/v1/organizations/:orgId/projects/stats',
          methods: ['GET'],
        },
      },
      note: 'All shorthand routes read your organization from the JWT — no need to include orgId in the URL.',
    };
  }

  @Get('health')
  @ApiExcludeEndpoint()
  health() {
    return { status: 'ok', service: 'api', timestamp: new Date().toISOString() };
  }
}
