import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { DatabaseModule } from './database.module';

// User is needed for the super_admin authentication check
import { User } from '../../auth-service/src/auth/entities/user.entity';
// All other entities are auto-discovered from the DataSource via DatabaseModule

async function bootstrap() {
  // ── 1. Boot NestJS (gives us the TypeORM DataSource) ─────────────────────
  const app = await NestFactory.create(DatabaseModule, { logger: ['error', 'warn'] });
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);

  // ── 2. Load ESM AdminJS packages ─────────────────────────────────────────
  //    Function('return import(...)')() bypasses TypeScript's import()→require()
  //    transform so the native ESM import() runs at runtime in Node.js CJS context.
  const dynImport = Function('m', 'return import(m)');
  const { default: AdminJS } = await dynImport('adminjs');
  const AdminJSTypeorm = await dynImport('@adminjs/typeorm');
  const { buildAuthenticatedRouter } = await dynImport('@adminjs/express');

  // ── 3. Patch data-mapper entities to act like BaseEntity (active-record) ────
  //    @adminjs/typeorm calls static methods (count, find, findOneBy, create …)
  //    that only exist on entities extending BaseEntity.
  //    Our entities use the data-mapper pattern, so we bridge the gap here.
  for (const meta of dataSource.entityMetadatas) {
    const E = meta.target as any;
    if (typeof E !== 'function') continue;
    const repo = () => dataSource.getRepository(E);
    E.getRepository = () => repo();
    E.count = (opts?: any) => repo().count(opts);
    E.find = (opts?: any) => repo().find(opts);
    E.findBy = (where?: any) => repo().findBy(where);
    E.findOneBy = (where?: any) => repo().findOneBy(where);
    E.create = (obj?: any) => repo().create(obj);
    E.save = (entity: any, opts?: any) => repo().save(entity, opts);
    E.update = (criteria: any, partial: any) => repo().update(criteria, partial);
    E.delete = (criteria: any) => repo().delete(criteria);
  }

  // ── 4. Register TypeORM adapter ───────────────────────────────────────────
  AdminJS.registerAdapter({
    Resource: AdminJSTypeorm.Resource,
    Database: AdminJSTypeorm.Database,
  });

  // ── 4b. Patch Database.resources to skip junction-table entities ───────────
  //    TypeORM includes auto-created junction tables in entityMetadatas with
  //    string targets (e.g. 'user_permissions_permission'). @adminjs/typeorm
  //    tries to create a Resource for every metadata including these, then
  //    calls this.model.getRepository() which fails on a plain string.
  AdminJSTypeorm.Database.prototype.resources = function () {
    const resources = [];
    for (const entityMetadata of this.dataSource.entityMetadatas) {
      if (typeof entityMetadata.target !== 'function') continue;
      resources.push(new AdminJSTypeorm.Resource(entityMetadata.target));
    }
    return resources;
  };

  // ── 4c. Patch Resource instance methods that call instance.save() / remove()
  //    @adminjs/typeorm calls instance.save() and instance.remove() on entity
  //    instances, but data-mapper entities don't have these instance methods.
  //    We override validateAndSave and delete on the Resource prototype to use
  //    the repo directly instead.
  AdminJSTypeorm.Resource.prototype.validateAndSave = async function (instance: any) {
    const repo = dataSource.getRepository(this.model);
    try {
      await repo.save(instance);
    } catch (error: any) {
      const { ValidationError } = await dynImport('adminjs');
      if (error.name === 'QueryFailedError') {
        throw new ValidationError({
          [error.column]: { type: 'QueryFailedError', message: error.message },
        });
      }
      throw error;
    }
  };

  AdminJSTypeorm.Resource.prototype.delete = async function (pk: any) {
    const idName = this.idName();
    const repo = dataSource.getRepository(this.model);
    const { ValidationError } = await dynImport('adminjs');
    try {
      const instance = await repo.findOneBy({ [idName]: pk });
      if (instance) await repo.remove(instance);
    } catch (error: any) {
      if (error.name === 'QueryFailedError') {
        throw new ValidationError({}, { type: 'QueryFailedError', message: error.message });
      }
      throw error;
    }
  };

  // ── 5. Configure AdminJS — pass the DataSource so all 18 entities are ──────
  //    auto-discovered (required for data mapper pattern entities)
  const adminJs = new AdminJS({
    rootPath: '/admin',
    branding: {
      companyName: 'Afronix Tracker Admin',
      logo: false,
    },
    databases: [dataSource],
  });

  // ── 5. Build authenticated Express router ─────────────────────────────────
  const adminRouter = buildAuthenticatedRouter(
    adminJs,
    {
      authenticate: async (email: string, password: string) => {
        const user = await userRepo
          .createQueryBuilder('user')
          .addSelect('user.password')
          .leftJoinAndSelect('user.role', 'role')
          .where('user.email = :email', { email })
          .getOne();

        if (!user || !user.password || !user.isActive) return null;
        if (!user.role || user.role.name !== 'super_admin') return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          email: user.email,
          id: user.id,
          name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
        };
      },
      cookieName: 'adminjs_session',
      cookiePassword:
        process.env.ADMIN_COOKIE_SECRET || 'afronix-admin-secret-change-in-production',
    },
    null,
    {
      resave: true,
      saveUninitialized: true,
      secret: process.env.ADMIN_SESSION_SECRET || 'afronix-session-secret-change-in-production',
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    },
  );

  // ── 6. Mount AdminJS router on NestJS HTTP server ─────────────────────────
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(adminJs.options.rootPath, adminRouter);

  const port = process.env.ADMIN_SERVICE_PORT || 3006;
  await app.listen(port);
  console.log(`\n✓ Afronix Admin Panel → http://localhost:${port}/admin\n`);
}

bootstrap().catch((err) => {
  console.error('Admin panel failed to start:', err);
  process.exit(1);
});
