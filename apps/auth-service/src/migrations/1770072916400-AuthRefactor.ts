import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthRefactor1770072916400 implements MigrationInterface {
  name = 'AuthRefactor1770072916400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth_invitations" RENAME COLUMN "role" TO "role_id"`);
    await queryRunner.query(
      `ALTER TYPE "public"."auth_invitations_role_enum" RENAME TO "auth_invitations_role_id_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "user_organizations" RENAME COLUMN "role" TO "role_id"`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_organizations_role_enum" RENAME TO "user_organizations_role_id_enum"`,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "module" character varying NOT NULL, "action" character varying NOT NULL, "description" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5bfbd558c6ee5cfdebdd1bbd4f6" UNIQUE ("code"), CONSTRAINT "PK_9f1634df753682faaf3d2bca55b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."oauth_accounts_provider_enum" AS ENUM('google', 'microsoft')`,
    );
    await queryRunner.query(
      `CREATE TABLE "oauth_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider" "public"."oauth_accounts_provider_enum" NOT NULL, "provider_user_id" character varying NOT NULL, "email" character varying NOT NULL, "access_token" character varying, "refresh_token" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710a81523f515b78f894e33bb10" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token" character varying NOT NULL, "ip_address" character varying, "user_agent" character varying, "expiresAt" TIMESTAMP NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "family" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_df6893d2063a4ea7bbf1eda31e5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f795ad14f31838e3ddc663ee15" ON "auth_refresh_tokens" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b0e55a5a233e403b1978a9a991" ON "auth_refresh_tokens" ("token") `,
    );
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `,
    );
    await queryRunner.query(`ALTER TABLE "auth_roles" DROP COLUMN "permissions"`);
    await queryRunner.query(`ALTER TABLE "auth_roles" DROP COLUMN "isActive"`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "subscription_status"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_subscription_status_enum"`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "subscription_started_at"`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "subscription_expires_at"`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "payment_cycle"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_payment_cycle_enum"`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "price_per_user"`);
    await queryRunner.query(`ALTER TABLE "auth_users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."auth_users_role_enum"`);
    await queryRunner.query(`ALTER TABLE "auth_roles" ADD "display_name" character varying`);
    await queryRunner.query(
      `ALTER TABLE "auth_roles" ADD "is_default" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_roles" ADD "is_system_role" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_roles" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "organizations" ADD "slug" character varying NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD CONSTRAINT "UQ_963693341bd612aa01ddf3a4b68" UNIQUE ("slug")`,
    );
    await queryRunner.query(`ALTER TABLE "organizations" ADD "domain" character varying`);
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD CONSTRAINT "UQ_98678ed828cc71e4f8a58c95d6b" UNIQUE ("domain")`,
    );
    await queryRunner.query(`ALTER TABLE "auth_users" ADD "profile_image" character varying`);
    await queryRunner.query(`ALTER TABLE "auth_users" ADD "role_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "auth_roles" DROP CONSTRAINT "PK_fa9e7a265809eafa9e1f47122e2"`,
    );
    await queryRunner.query(`ALTER TABLE "auth_roles" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "auth_roles" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_roles" ADD CONSTRAINT "PK_fa9e7a265809eafa9e1f47122e2" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(`ALTER TABLE "auth_invitations" DROP COLUMN "role_id"`);
    await queryRunner.query(`ALTER TABLE "auth_invitations" ADD "role_id" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_organizations" DROP COLUMN "role_id"`);
    await queryRunner.query(`ALTER TABLE "user_organizations" ADD "role_id" uuid NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b5b9d9e0b4721a1b5aeac416b7"`);
    await queryRunner.query(
      `ALTER TABLE "auth_users" ADD CONSTRAINT "UQ_13d8b49e55a8b06bee6bbc828fb" UNIQUE ("email")`,
    );
    await queryRunner.query(`ALTER TABLE "auth_users" ALTER COLUMN "password" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b5b9d9e0b4721a1b5aeac416b7" ON "auth_users" ("email", "organization_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_invitations" ADD CONSTRAINT "FK_fee3bb2d743cfada4ea291b07a4" FOREIGN KEY ("role_id") REFERENCES "auth_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organizations" ADD CONSTRAINT "FK_c8b34a272985031803338e9f2cf" FOREIGN KEY ("role_id") REFERENCES "auth_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_accounts" ADD CONSTRAINT "FK_22a05e92f51a983475f9281d3b0" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_users" ADD CONSTRAINT "FK_b9a6f5e2eb8d3372d2158cbd96f" FOREIGN KEY ("role_id") REFERENCES "auth_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_refresh_tokens" ADD CONSTRAINT "FK_f795ad14f31838e3ddc663ee150" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "auth_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "auth_permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_refresh_tokens" DROP CONSTRAINT "FK_f795ad14f31838e3ddc663ee150"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_users" DROP CONSTRAINT "FK_b9a6f5e2eb8d3372d2158cbd96f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_accounts" DROP CONSTRAINT "FK_22a05e92f51a983475f9281d3b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organizations" DROP CONSTRAINT "FK_c8b34a272985031803338e9f2cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_invitations" DROP CONSTRAINT "FK_fee3bb2d743cfada4ea291b07a4"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_b5b9d9e0b4721a1b5aeac416b7"`);
    await queryRunner.query(`ALTER TABLE "auth_users" ALTER COLUMN "password" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "auth_users" DROP CONSTRAINT "UQ_13d8b49e55a8b06bee6bbc828fb"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b5b9d9e0b4721a1b5aeac416b7" ON "auth_users" ("email", "organization_id") `,
    );
    await queryRunner.query(`ALTER TABLE "user_organizations" DROP COLUMN "role_id"`);
    await queryRunner.query(
      `ALTER TABLE "user_organizations" ADD "role_id" "public"."user_organizations_role_id_enum" NOT NULL DEFAULT 'user'`,
    );
    await queryRunner.query(`ALTER TABLE "auth_invitations" DROP COLUMN "role_id"`);
    await queryRunner.query(
      `ALTER TABLE "auth_invitations" ADD "role_id" "public"."auth_invitations_role_id_enum" NOT NULL DEFAULT 'user'`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_roles" DROP CONSTRAINT "PK_fa9e7a265809eafa9e1f47122e2"`,
    );
    await queryRunner.query(`ALTER TABLE "auth_roles" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "auth_roles" ADD "id" SERIAL NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "auth_roles" ADD CONSTRAINT "PK_fa9e7a265809eafa9e1f47122e2" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(`ALTER TABLE "auth_users" DROP COLUMN "role_id"`);
    await queryRunner.query(`ALTER TABLE "auth_users" DROP COLUMN "profile_image"`);
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP CONSTRAINT "UQ_98678ed828cc71e4f8a58c95d6b"`,
    );
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "domain"`);
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP CONSTRAINT "UQ_963693341bd612aa01ddf3a4b68"`,
    );
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "slug"`);
    await queryRunner.query(`ALTER TABLE "auth_roles" DROP COLUMN "is_active"`);
    await queryRunner.query(`ALTER TABLE "auth_roles" DROP COLUMN "is_system_role"`);
    await queryRunner.query(`ALTER TABLE "auth_roles" DROP COLUMN "is_default"`);
    await queryRunner.query(`ALTER TABLE "auth_roles" DROP COLUMN "display_name"`);
    await queryRunner.query(
      `CREATE TYPE "public"."auth_users_role_enum" AS ENUM('owner', 'admin', 'manager', 'user')`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_users" ADD "role" "public"."auth_users_role_enum" NOT NULL DEFAULT 'user'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "price_per_user" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_payment_cycle_enum" AS ENUM('monthly', 'quarterly', 'annual')`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "payment_cycle" "public"."organizations_payment_cycle_enum" NOT NULL DEFAULT 'monthly'`,
    );
    await queryRunner.query(`ALTER TABLE "organizations" ADD "subscription_expires_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "organizations" ADD "subscription_started_at" TIMESTAMP`);
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_subscription_status_enum" AS ENUM('active', 'trial', 'expired', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "subscription_status" "public"."organizations_subscription_status_enum" NOT NULL DEFAULT 'trial'`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_roles" ADD "isActive" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "auth_roles" ADD "permissions" text`);
    await queryRunner.query(`DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b0e55a5a233e403b1978a9a991"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f795ad14f31838e3ddc663ee15"`);
    await queryRunner.query(`DROP TABLE "auth_refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "oauth_accounts"`);
    await queryRunner.query(`DROP TYPE "public"."oauth_accounts_provider_enum"`);
    await queryRunner.query(`DROP TABLE "auth_permissions"`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_organizations_role_id_enum" RENAME TO "user_organizations_role_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "user_organizations" RENAME COLUMN "role_id" TO "role"`);
    await queryRunner.query(
      `ALTER TYPE "public"."auth_invitations_role_id_enum" RENAME TO "auth_invitations_role_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "auth_invitations" RENAME COLUMN "role_id" TO "role"`);
  }
}
