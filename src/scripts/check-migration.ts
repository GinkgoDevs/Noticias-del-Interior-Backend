import { AppDataSource } from '../database/data-source';

async function checkMigration() {
    await AppDataSource.initialize();
    const result = await AppDataSource.query('SELECT * FROM "migrations" ORDER BY id DESC');
    console.log("Executed migrations:", result.map((r: any) => r.name || r.id));
    await AppDataSource.destroy();
}
checkMigration().catch(console.error);
