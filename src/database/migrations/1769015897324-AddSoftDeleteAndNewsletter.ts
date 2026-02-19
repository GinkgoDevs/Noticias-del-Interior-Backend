import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteAndNewsletter1769015897324 implements MigrationInterface {
    name = 'AddSoftDeleteAndNewsletter1769015897324'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Newsletter Table
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "newsletter_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "subscribedAt" TIMESTAMP NOT NULL DEFAULT now(), "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_newsletter_email" UNIQUE ("email"), CONSTRAINT "PK_newsletter_id" PRIMARY KEY ("id"))`);

        // Soft Delete News
        await queryRunner.query(`ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`);

        // Safe column length adjustments (avoiding DROPS)
        await queryRunner.query(`ALTER TABLE "news" ALTER COLUMN "slug" TYPE character varying(255)`);
        await queryRunner.query(`ALTER TABLE "news" ALTER COLUMN "externalSource" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "news" ALTER COLUMN "externalId" TYPE character varying(64)`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "username" TYPE character varying(100)`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "name" TYPE character varying(150)`);

        // Re-create comments
        await queryRunner.query(`COMMENT ON COLUMN "news"."externalSource" IS 'Origen externo (ej: wordpress)'`);
        await queryRunner.query(`COMMENT ON COLUMN "news"."externalId" IS 'ID del sistema de origen'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news" DROP COLUMN IF EXISTS "deletedAt"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_subscriptions"`);
    }
}
