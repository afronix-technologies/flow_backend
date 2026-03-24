# Afronix Tracker — AI Development Rules

## Admin Panel Rule (CRITICAL)

This project has an AdminJS admin panel located at `apps/admin-service/`.

**Every single TypeORM entity in this project MUST be registered in the admin panel.**

When you create a new entity (`.entity.ts` file), you MUST:

1. Import the entity in `apps/admin-service/src/database.module.ts`
2. Add it to the `ALL_ENTITIES` array
3. No exceptions — every entity must be visible and manageable in the admin panel

### Admin panel access
Only users with role name `super_admin` can log into the admin panel. To create one:
```bash
npm run create:superadmin
```
Never change the authenticate function to allow any other role.

### Current registered entities (update this list when you add new ones):

**Auth Service:**
- `UserEntity`
- `OrganizationEntity`
- `UserOrganizationEntity`
- `InvitationEntity`
- `RoleEntity`
- `PermissionEntity`
- `OAuthAccountEntity`
- `RefreshTokenEntity`

**Settings Service:**
- `NavigationItemEntity`
- `NavigationRoleOverrideEntity`
- `FeatureCatalogEntity`
- `OrganizationFeatureEntity`
- `WorkspacePackageEntity`
- `OrganizationWorkspaceEntity`
- `ContactSettingsEntity`
- `GeneralSettingsEntity`
- `RegionalSettingsEntity`
- `WorkScheduleEntity` (work_policies_schedule)
- `BreakPolicyEntity` (work_policies_break)
- `OvertimePolicyEntity` (work_policies_overtime)
- `OrgHolidayEntity` (work_policies_holidays)

**File Service:**
- `FileEntity`

---

## General Rules

- This is a NestJS monorepo using `apps/` for microservices and `libs/` for shared code
- Database: TypeORM + PostgreSQL
- Auth: JWT via cookies, roles & permissions guards
- When adding a new microservice, add it to `nest-cli.json` and `docker-compose.yml`
- Environment variables go in `.env` — never hardcode secrets
- Every new API endpoint must have Swagger `@ApiOperation` and `@ApiResponse` decorators

## Branch Strategy

- `develop` — staging environment
- `main` — live/production environment
- Never commit directly to `main`
