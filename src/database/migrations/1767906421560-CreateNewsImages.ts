import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateNewsImages1767906421560 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "news_images",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "uuid",
                },
                {
                    name: "publicId",
                    type: "varchar",
                },
                {
                    name: "url",
                    type: "varchar",
                },
                {
                    name: "source",
                    type: "varchar",
                    default: "'content'",
                },
                {
                    name: "position",
                    type: "int",
                    default: 0,
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()",
                },
                {
                    name: "newsId",
                    type: "uuid",
                    isNullable: true,
                },
            ],
        }), true);

        await queryRunner.createForeignKey("news_images", new TableForeignKey({
            columnNames: ["newsId"],
            referencedColumnNames: ["id"],
            referencedTableName: "news",
            onDelete: "CASCADE",
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("news_images");
        const foreignKey = table!.foreignKeys.find(fk => fk.columnNames.indexOf("newsId") !== -1);
        await queryRunner.dropForeignKey("news_images", foreignKey!);
        await queryRunner.dropTable("news_images");
    }

}
