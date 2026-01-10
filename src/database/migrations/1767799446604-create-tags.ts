import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTags1767799446604 implements MigrationInterface {
    name = 'CreateTags1767799446604'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "active" boolean NOT NULL DEFAULT true, "externalSource" character varying, "externalId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_tags_external" ON "tags" ("externalSource", "externalId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_tags_slug" ON "tags" ("slug") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."uq_tags_slug"`);
        await queryRunner.query(`DROP INDEX "public"."idx_tags_external"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
