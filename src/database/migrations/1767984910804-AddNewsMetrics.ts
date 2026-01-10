import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewsMetrics1767984910804 implements MigrationInterface {
    name = 'AddNewsMetrics1767984910804'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Solo agregamos las métricas, sin tocar slug ni usuarios
        await queryRunner.query(`ALTER TABLE "news" ADD "views" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "news" ADD "lastViewedAt" TIMESTAMP`);

        // Índices para optimizar el sorting por views (Trending)
        await queryRunner.query(`CREATE INDEX "idx_news_views" ON "news" ("views")`);
        // Índice compuesto para trending reciente podría ser útil, pero empecemos simple
        // CREATE INDEX "idx_news_views_published" ON "news" ("views", "publishedAt");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_news_views"`);
        await queryRunner.query(`ALTER TABLE "news" DROP COLUMN "lastViewedAt"`);
        await queryRunner.query(`ALTER TABLE "news" DROP COLUMN "views"`);
    }
}
