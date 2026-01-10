import { AppDataSource } from '../database/data-source';

async function fix() {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();

    console.log("Checking schema...");

    // 1. Drop coverImageUrl
    if (await queryRunner.hasColumn("news", "coverImageUrl")) {
        console.log("Dropping coverImageUrl...");
        await queryRunner.dropColumn("news", "coverImageUrl");
    } else {
        console.log("coverImageUrl not found (clean).");
    }

    // 2. Add mainImageUrl
    if (!(await queryRunner.hasColumn("news", "mainImageUrl"))) {
        console.log("Adding mainImageUrl...");
        await queryRunner.query('ALTER TABLE "news" ADD "mainImageUrl" varchar');
    } else {
        console.log("mainImageUrl already exists.");
    }

    // 3. Add mainImageId
    if (!(await queryRunner.hasColumn("news", "mainImageId"))) {
        console.log("Adding mainImageId...");
        await queryRunner.query('ALTER TABLE "news" ADD "mainImageId" varchar');
        await queryRunner.query('COMMENT ON COLUMN "news"."mainImageId" IS \'Cloudinary Public ID\'');
    } else {
        console.log("mainImageId already exists.");
    }

    await AppDataSource.destroy();
    console.log("Schema fixed manually.");
}
fix().catch(console.error);
