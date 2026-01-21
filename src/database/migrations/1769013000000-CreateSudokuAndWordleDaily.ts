import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSudokuAndWordleDaily1769013000000 implements MigrationInterface {
    name = 'CreateSudokuAndWordleDaily1769013000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "wordle_daily" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "word" character varying(5) NOT NULL, "clue" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_wordle_date" UNIQUE ("date"), CONSTRAINT "PK_wordle_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sudoku_daily" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "puzzle" json NOT NULL, "solution" json NOT NULL, "difficulty" character varying NOT NULL DEFAULT 'medium', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_sudoku_date" UNIQUE ("date"), CONSTRAINT "PK_sudoku_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "sudoku_daily"`);
        await queryRunner.query(`DROP TABLE "wordle_daily"`);
    }

}
