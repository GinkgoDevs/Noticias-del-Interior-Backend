import { AppDataSource } from '../database/data-source';

async function syncMigration() {
    await AppDataSource.initialize();

    const migrationName = 'FixNewsImages1867895529731';
    const timestamp = 1867895529731; // Matches the file prefix we created

    // Check if exists
    const exists = await AppDataSource.query(
        'SELECT * FROM "migrations" WHERE name = $1',
        [migrationName]
    );

    if (exists.length === 0) {
        console.log(`Marking ${migrationName} as executed...`);
        await AppDataSource.query(
            'INSERT INTO "migrations" ("timestamp", "name") VALUES ($1, $2)',
            [timestamp, migrationName]
        );
        console.log("Done.");
    } else {
        console.log("Migration was already marked as executed.");
    }

    await AppDataSource.destroy();
}
syncMigration().catch(console.error);
