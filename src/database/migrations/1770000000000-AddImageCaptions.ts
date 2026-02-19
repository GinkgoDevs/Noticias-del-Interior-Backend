import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddImageCaptions1770000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add caption to gallery images (news_images table)
        await queryRunner.addColumn("news_images", new TableColumn({
            name: "caption",
            type: "varchar",
            length: "500",
            isNullable: true,
        }));

        // Add mainImageCaption to news table (for cover image)
        await queryRunner.addColumn("news", new TableColumn({
            name: "mainImageCaption",
            type: "varchar",
            length: "500",
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("news_images", "caption");
        await queryRunner.dropColumn("news", "mainImageCaption");
    }

}
