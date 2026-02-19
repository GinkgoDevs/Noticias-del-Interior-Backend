import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCrossword1768140000000 implements MigrationInterface {
    name = 'CreateCrossword1768140000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "crossword_words_direction_enum" AS ENUM('ACROSS', 'DOWN')`);
        await queryRunner.query(`CREATE TABLE "crossword_daily" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "size" integer NOT NULL DEFAULT '12', "grid" json NOT NULL, "solution" json NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_crossword_date" UNIQUE ("date"), CONSTRAINT "PK_crossword_daily" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "crossword_words" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "word" character varying NOT NULL, "clue" text NOT NULL, "row" integer NOT NULL, "col" integer NOT NULL, "direction" "crossword_words_direction_enum" NOT NULL, "difficulty" character varying NOT NULL DEFAULT 'media', "crosswordId" uuid, CONSTRAINT "PK_crossword_words" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "crossword_words" ADD CONSTRAINT "FK_crossword_words_daily" FOREIGN KEY ("crosswordId") REFERENCES "crossword_daily"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "crossword_words" DROP CONSTRAINT "FK_crossword_words_daily"`);
        await queryRunner.query(`DROP TABLE "crossword_words"`);
        await queryRunner.query(`DROP TABLE "crossword_daily"`);
        await queryRunner.query(`DROP TYPE "crossword_words_direction_enum"`);
    }
}
