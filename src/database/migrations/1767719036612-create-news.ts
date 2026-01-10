import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNews1767719036612 implements MigrationInterface {
    name = 'CreateNews1767719036612'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."news_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')`);
        await queryRunner.query(`CREATE TABLE "news" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "slug" character varying NOT NULL, "excerpt" text NOT NULL, "content" text NOT NULL, "status" "public"."news_status_enum" NOT NULL DEFAULT 'DRAFT', "publishedAt" TIMESTAMP, "scheduledAt" TIMESTAMP, "featured" boolean NOT NULL DEFAULT false, "featuredOrder" integer, "seoTitle" character varying, "seoDescription" text, "canonicalUrl" character varying, "externalSource" character varying, "externalId" character varying, "legacyUrl" character varying, "importedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "categoryId" uuid NOT NULL, "authorId" uuid NOT NULL, CONSTRAINT "PK_39a43dfcb6007180f04aff2357e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_news_status_published_at" ON "news" ("status", "publishedAt") `);
        await queryRunner.query(`CREATE INDEX "idx_news_featured" ON "news" ("featured") `);
        await queryRunner.query(`CREATE INDEX "idx_news_status" ON "news" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_news_published_at" ON "news" ("publishedAt") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_news_slug" ON "news" ("slug") `);
        await queryRunner.query(`ALTER TABLE "news" ADD CONSTRAINT "FK_12a76d9b0f635084194b2c6aa01" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "news" ADD CONSTRAINT "FK_18ab67e7662dbc5d45dc53a6e00" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news" DROP CONSTRAINT "FK_18ab67e7662dbc5d45dc53a6e00"`);
        await queryRunner.query(`ALTER TABLE "news" DROP CONSTRAINT "FK_12a76d9b0f635084194b2c6aa01"`);
        await queryRunner.query(`DROP INDEX "public"."uq_news_slug"`);
        await queryRunner.query(`DROP INDEX "public"."idx_news_published_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_news_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_news_featured"`);
        await queryRunner.query(`DROP INDEX "public"."idx_news_status_published_at"`);
        await queryRunner.query(`DROP TABLE "news"`);
        await queryRunner.query(`DROP TYPE "public"."news_status_enum"`);
    }

}
