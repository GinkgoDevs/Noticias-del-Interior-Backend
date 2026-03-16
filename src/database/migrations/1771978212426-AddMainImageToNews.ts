import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMainImageToNews1771978212426 implements MigrationInterface {
    name = 'AddMainImageToNews1771978212426'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "crossword_words" DROP CONSTRAINT "FK_crossword_words_daily"`);
        await queryRunner.query(`DROP INDEX "public"."idx_tags_external"`);
        await queryRunner.query(`DROP INDEX "public"."idx_news_views"`);
        await queryRunner.query(`COMMENT ON COLUMN "news"."mainImageId" IS NULL`);
        await queryRunner.query(`ALTER TYPE "public"."ads_position_enum" RENAME TO "ads_position_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ads_position_enum" AS ENUM('HEADER', 'SIDEBAR', 'ARTICLE_SIDEBAR', 'NEWS_LIST', 'CONTENT', 'FOOTER')`);
        await queryRunner.query(`ALTER TABLE "ads" ALTER COLUMN "position" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ads" ALTER COLUMN "position" TYPE "public"."ads_position_enum" USING "position"::"text"::"public"."ads_position_enum"`);
        await queryRunner.query(`ALTER TABLE "ads" ALTER COLUMN "position" SET DEFAULT 'NEWS_LIST'`);
        await queryRunner.query(`DROP TYPE "public"."ads_position_enum_old"`);
        await queryRunner.query(`ALTER TABLE "crossword_words" ALTER COLUMN "direction" SET DEFAULT 'ACROSS'`);
        await queryRunner.query(`ALTER TABLE "crossword_words" ADD CONSTRAINT "FK_82f093d85396a7ea0f4b899b3eb" FOREIGN KEY ("crosswordId") REFERENCES "crossword_daily"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "crossword_words" DROP CONSTRAINT "FK_82f093d85396a7ea0f4b899b3eb"`);
        await queryRunner.query(`ALTER TABLE "crossword_words" ALTER COLUMN "direction" DROP DEFAULT`);
        await queryRunner.query(`CREATE TYPE "public"."ads_position_enum_old" AS ENUM('HEADER', 'SIDEBAR', 'NEWS_LIST', 'CONTENT', 'FOOTER')`);
        await queryRunner.query(`ALTER TABLE "ads" ALTER COLUMN "position" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ads" ALTER COLUMN "position" TYPE "public"."ads_position_enum_old" USING "position"::"text"::"public"."ads_position_enum_old"`);
        await queryRunner.query(`ALTER TABLE "ads" ALTER COLUMN "position" SET DEFAULT 'NEWS_LIST'`);
        await queryRunner.query(`DROP TYPE "public"."ads_position_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ads_position_enum_old" RENAME TO "ads_position_enum"`);
        await queryRunner.query(`COMMENT ON COLUMN "news"."mainImageId" IS 'Cloudinary Public ID'`);
        await queryRunner.query(`CREATE INDEX "idx_news_views" ON "news" ("views") `);
        await queryRunner.query(`CREATE INDEX "idx_tags_external" ON "tags" ("externalId", "externalSource") `);
        await queryRunner.query(`ALTER TABLE "crossword_words" ADD CONSTRAINT "FK_crossword_words_daily" FOREIGN KEY ("crosswordId") REFERENCES "crossword_daily"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
