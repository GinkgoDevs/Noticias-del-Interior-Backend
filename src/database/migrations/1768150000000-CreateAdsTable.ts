import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAdsTable1768150000000 implements MigrationInterface {
    name = 'CreateAdsTable1768150000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "ads_position_enum" AS ENUM('HEADER', 'SIDEBAR', 'NEWS_LIST', 'CONTENT', 'FOOTER')`);
        await queryRunner.query(`CREATE TABLE "ads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "imageUrl" text NOT NULL, "linkUrl" text, "position" "ads_position_enum" NOT NULL DEFAULT 'NEWS_LIST', "isActive" boolean NOT NULL DEFAULT true, "views" integer NOT NULL DEFAULT '0', "clicks" integer NOT NULL DEFAULT '0', "startDate" TIMESTAMP, "endDate" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ads" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "ads"`);
        await queryRunner.query(`DROP TYPE "ads_position_enum"`);
    }
}
