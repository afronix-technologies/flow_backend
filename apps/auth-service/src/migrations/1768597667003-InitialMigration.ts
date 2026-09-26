import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1768597667003 implements MigrationInterface {
  name = 'InitialMigration1768597667003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."auth_invitations_role_enum" AS ENUM('owner', 'admin', 'manager', 'user')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."auth_invitations_status_enum" AS ENUM('pending', 'accepted', 'expired', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "invited_by_user_id" uuid NOT NULL, "email" character varying NOT NULL, "role" "public"."auth_invitations_role_enum" NOT NULL DEFAULT 'user', "token" character varying NOT NULL, "status" "public"."auth_invitations_status_enum" NOT NULL DEFAULT 'pending', "expires_at" TIMESTAMP NOT NULL, "accepted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_31a0c80e802c74ffd9327fc4ab9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_organizations_role_enum" AS ENUM('owner', 'admin', 'manager', 'user')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "role" "public"."user_organizations_role_enum" NOT NULL DEFAULT 'user', "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_51ed3f60fdf013ee5041d2d4d3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f143fa57706c0fb840301ad704" ON "user_organizations" ("user_id", "organization_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_subscription_status_enum" AS ENUM('active', 'trial', 'expired', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_payment_cycle_enum" AS ENUM('monthly', 'quarterly', 'annual')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_onboarding_step_enum" AS ENUM('registered', 'email_verified', 'team_details', 'template_selected', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "industry" character varying, "company_size" character varying, "timezone" character varying, "subscription_status" "public"."organizations_subscription_status_enum" NOT NULL DEFAULT 'trial', "subscription_started_at" TIMESTAMP, "subscription_expires_at" TIMESTAMP, "payment_cycle" "public"."organizations_payment_cycle_enum" NOT NULL DEFAULT 'monthly', "team_size" integer NOT NULL DEFAULT '0', "price_per_user" numeric(10,2) NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "onboarding_step" "public"."organizations_onboarding_step_enum" NOT NULL DEFAULT 'registered', "template" character varying, "join_link_token" character varying, "join_link_expires_at" TIMESTAMP, "join_link_enabled" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b0c048302f2b5ce3e7be3907bd2" UNIQUE ("join_link_token"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."auth_users_role_enum" AS ENUM('owner', 'admin', 'manager', 'user')`,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "email" character varying NOT NULL, "first_name" character varying, "last_name" character varying, "password" character varying NOT NULL, "role" "public"."auth_users_role_enum" NOT NULL DEFAULT 'user', "is_active" boolean NOT NULL DEFAULT true, "email_verified" boolean NOT NULL DEFAULT false, "email_verification_token" character varying, "password_reset_token" character varying, "password_reset_expires" TIMESTAMP, "last_login" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c88cc8077366b470dafc2917366" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b5b9d9e0b4721a1b5aeac416b7" ON "auth_users" ("email", "organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token" character varying NOT NULL, "ip_address" character varying, "user_agent" character varying, "expiresAt" TIMESTAMP NOT NULL, "isValid" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_641507381f32580e8479efc36cd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_50ccaa6440288a06f0ba693ccc" ON "auth_sessions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9a99b8526fd318f63477dcfccd" ON "auth_sessions" ("token") `,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_roles" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "permissions" text, "isActive" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6e74f330e34555ae90068b03928" UNIQUE ("name"), CONSTRAINT "PK_fa9e7a265809eafa9e1f47122e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_invitations" ADD CONSTRAINT "FK_a36e78cf70fd1fa2b0b57e479ea" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_invitations" ADD CONSTRAINT "FK_a4198988451c0a8042ca88b7453" FOREIGN KEY ("invited_by_user_id") REFERENCES "auth_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organizations" ADD CONSTRAINT "FK_6881b23cd1a8924e4bf61515fbb" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organizations" ADD CONSTRAINT "FK_9dae16cdea66aeba1eb6f6ddf29" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_users" ADD CONSTRAINT "FK_d0b3b7c01c35a40e83f3a4bfe82" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD CONSTRAINT "FK_50ccaa6440288a06f0ba693ccc6" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" DROP CONSTRAINT "FK_50ccaa6440288a06f0ba693ccc6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_users" DROP CONSTRAINT "FK_d0b3b7c01c35a40e83f3a4bfe82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organizations" DROP CONSTRAINT "FK_9dae16cdea66aeba1eb6f6ddf29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organizations" DROP CONSTRAINT "FK_6881b23cd1a8924e4bf61515fbb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_invitations" DROP CONSTRAINT "FK_a4198988451c0a8042ca88b7453"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_invitations" DROP CONSTRAINT "FK_a36e78cf70fd1fa2b0b57e479ea"`,
    );
    await queryRunner.query(`DROP TABLE "auth_roles"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9a99b8526fd318f63477dcfccd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_50ccaa6440288a06f0ba693ccc"`);
    await queryRunner.query(`DROP TABLE "auth_sessions"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b5b9d9e0b4721a1b5aeac416b7"`);
    await queryRunner.query(`DROP TABLE "auth_users"`);
    await queryRunner.query(`DROP TYPE "public"."auth_users_role_enum"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_onboarding_step_enum"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_payment_cycle_enum"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_subscription_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f143fa57706c0fb840301ad704"`);
    await queryRunner.query(`DROP TABLE "user_organizations"`);
    await queryRunner.query(`DROP TYPE "public"."user_organizations_role_enum"`);
    await queryRunner.query(`DROP TABLE "auth_invitations"`);
    await queryRunner.query(`DROP TYPE "public"."auth_invitations_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."auth_invitations_role_enum"`);
  }
}
