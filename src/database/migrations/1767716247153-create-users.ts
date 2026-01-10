import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsers1767716247153 implements MigrationInterface {
    name = 'CreateUsers1767716247153'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'EDITOR')`);
        await queryRunner.query(`CREATE TYPE "public"."users_avatarsource_enum" AS ENUM('google', 'custom', 'none')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "username" character varying, "name" character varying, "passwordHash" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'EDITOR', "active" boolean NOT NULL DEFAULT true, "emailVerified" boolean NOT NULL DEFAULT false, "authProvider" character varying NOT NULL, "authProviderId" character varying NOT NULL, "avatarUrl" character varying, "avatarSource" "public"."users_avatarsource_enum" NOT NULL DEFAULT 'none', "bio" text, "locale" character varying NOT NULL DEFAULT 'es-AR', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "lastLoginAt" TIMESTAMP, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_users_auth_provider_id" ON "users" ("authProviderId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_users_email" ON "users" ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."uq_users_email"`);
        await queryRunner.query(`DROP INDEX "public"."idx_users_auth_provider_id"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_avatarsource_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
