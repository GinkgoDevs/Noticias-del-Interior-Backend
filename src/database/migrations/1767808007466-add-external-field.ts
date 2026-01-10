import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExternalIdentifiersForMigration1767809000000
    implements MigrationInterface {
    name = 'AddExternalIdentifiersForMigration1767809000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        /* =========================
           USERS
        ========================= */

        await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "externalSource" character varying(50)
    `);

        await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "externalId" character varying(64)
    `);

        await queryRunner.query(`
      COMMENT ON COLUMN "users"."externalSource"
      IS 'Origen externo (ej: wordpress)'
    `);

        await queryRunner.query(`
      COMMENT ON COLUMN "users"."externalId"
      IS 'ID del sistema de origen'
    `);

        /* =========================
           CATEGORIES
        ========================= */

        await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "externalSource" character varying(50)
    `);

        await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "externalId" character varying(64)
    `);

        await queryRunner.query(`
      COMMENT ON COLUMN "categories"."externalSource"
      IS 'Origen externo (ej: wordpress)'
    `);

        await queryRunner.query(`
      COMMENT ON COLUMN "categories"."externalId"
      IS 'ID del sistema de origen'
    `);

        /* =========================
           TAGS
        ========================= */

        await queryRunner.query(`
      ALTER TABLE "tags"
      ADD COLUMN IF NOT EXISTS "externalSource" character varying(50)
    `);

        await queryRunner.query(`
      ALTER TABLE "tags"
      ADD COLUMN IF NOT EXISTS "externalId" character varying(64)
    `);

        await queryRunner.query(`
      COMMENT ON COLUMN "tags"."externalSource"
      IS 'Origen externo (ej: wordpress)'
    `);

        await queryRunner.query(`
      COMMENT ON COLUMN "tags"."externalId"
      IS 'ID del sistema de origen'
    `);

        /* =========================
           NEWS
        ========================= */

        await queryRunner.query(`
      ALTER TABLE "news"
      ADD COLUMN IF NOT EXISTS "externalSource" character varying(50)
    `);

        await queryRunner.query(`
      ALTER TABLE "news"
      ADD COLUMN IF NOT EXISTS "externalId" character varying(64)
    `);

        await queryRunner.query(`
      COMMENT ON COLUMN "news"."externalSource"
      IS 'Origen externo (ej: wordpress)'
    `);

        await queryRunner.query(`
      COMMENT ON COLUMN "news"."externalId"
      IS 'ID del sistema de origen'
    `);

        /* =========================
           ENUM USER ROLE
        ========================= */

        await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'users_role_enum_new'
        ) THEN
          CREATE TYPE "users_role_enum_new"
          AS ENUM ('ADMIN', 'EDITOR', 'AUTHOR');
        END IF;
      END
      $$;
    `);

        await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" DROP DEFAULT
    `);

        await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role"
      TYPE "users_role_enum_new"
      USING "role"::text::"users_role_enum_new"
    `);

        await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role"
      SET DEFAULT 'EDITOR'
    `);

        await queryRunner.query(`
      DROP TYPE IF EXISTS "users_role_enum"
    `);

        await queryRunner.query(`
      ALTER TYPE "users_role_enum_new"
      RENAME TO "users_role_enum"
    `);

        /* =========================
           UNIQUE INDEXES
        ========================= */

        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_users_external"
      ON "users" ("externalSource", "externalId")
    `);

        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_categories_external"
      ON "categories" ("externalSource", "externalId")
    `);

        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_tags_external"
      ON "tags" ("externalSource", "externalId")
    `);

        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_news_external"
      ON "news" ("externalSource", "externalId")
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        /* =========================
           DROP INDEXES
        ========================= */

        await queryRunner.query(`DROP INDEX IF EXISTS "uq_news_external"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "uq_tags_external"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "uq_categories_external"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "uq_users_external"`);

        /* =========================
           DROP COLUMNS
        ========================= */

        await queryRunner.query(`
      ALTER TABLE "news"
      DROP COLUMN IF EXISTS "externalId",
      DROP COLUMN IF EXISTS "externalSource"
    `);

        await queryRunner.query(`
      ALTER TABLE "tags"
      DROP COLUMN IF EXISTS "externalId",
      DROP COLUMN IF EXISTS "externalSource"
    `);

        await queryRunner.query(`
      ALTER TABLE "categories"
      DROP COLUMN IF EXISTS "externalId",
      DROP COLUMN IF EXISTS "externalSource"
    `);

        await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "externalId",
      DROP COLUMN IF EXISTS "externalSource"
    `);

        /* =========================
           REVERT ENUM
        ========================= */

        await queryRunner.query(`
      CREATE TYPE "users_role_enum_old"
      AS ENUM ('ADMIN', 'EDITOR')
    `);

        await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role"
      TYPE "users_role_enum_old"
      USING "role"::text::"users_role_enum_old"
    `);

        await queryRunner.query(`
      DROP TYPE "users_role_enum"
    `);

        await queryRunner.query(`
      ALTER TYPE "users_role_enum_old"
      RENAME TO "users_role_enum"
    `);
    }
}
