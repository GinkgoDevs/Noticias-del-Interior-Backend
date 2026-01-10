import { AppDataSource } from '../database/data-source';

async function check() {
    await AppDataSource.initialize();
    const runner = AppDataSource.createQueryRunner();
    const table = await runner.getTable("news");
    if (table) {
        console.log("Columns in news table:", table.columns.map(c => c.name).join(", "));
    } else {
        console.log("Table 'news' not found");
    }
    await AppDataSource.destroy();
}
check().catch(console.error);
