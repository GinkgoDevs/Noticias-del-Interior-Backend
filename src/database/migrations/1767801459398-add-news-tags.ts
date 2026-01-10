import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewsTags1767801459398 implements MigrationInterface {
    name = 'AddNewsTags1767801459398'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "news_tags" ("newsId" uuid NOT NULL, "tagId" uuid NOT NULL, CONSTRAINT "PK_729533afcb9b8c022a528071750" PRIMARY KEY ("newsId", "tagId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_582fa57d7772a6b79efdaa4e53" ON "news_tags" ("newsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_38708534ec4c251fd2c10d302c" ON "news_tags" ("tagId") `);
        await queryRunner.query(`DROP INDEX "public"."idx_tags_external"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "name" character varying(120) NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."uq_tags_slug"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "slug" character varying(120) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "externalSource"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "externalSource" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "externalId"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "externalId" character varying(64)`);
        await queryRunner.query(`CREATE INDEX "idx_tags_external" ON "tags" ("externalSource", "externalId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_tags_slug" ON "tags" ("slug") `);
        await queryRunner.query(`ALTER TABLE "news_tags" ADD CONSTRAINT "FK_582fa57d7772a6b79efdaa4e538" FOREIGN KEY ("newsId") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "news_tags" ADD CONSTRAINT "FK_38708534ec4c251fd2c10d302c5" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news_tags" DROP CONSTRAINT "FK_38708534ec4c251fd2c10d302c5"`);
        await queryRunner.query(`ALTER TABLE "news_tags" DROP CONSTRAINT "FK_582fa57d7772a6b79efdaa4e538"`);
        await queryRunner.query(`DROP INDEX "public"."uq_tags_slug"`);
        await queryRunner.query(`DROP INDEX "public"."idx_tags_external"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "externalId"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "externalId" character varying`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "externalSource"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "externalSource" character varying`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "slug" character varying NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_tags_slug" ON "tags" ("slug") `);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_tags_external" ON "tags" ("externalId", "externalSource") `);
        await queryRunner.query(`DROP INDEX "public"."IDX_38708534ec4c251fd2c10d302c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_582fa57d7772a6b79efdaa4e53"`);
        await queryRunner.query(`DROP TABLE "news_tags"`);
    }

}
