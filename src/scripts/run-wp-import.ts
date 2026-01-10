import { AppDataSource } from '../database/data-source';
import { importCategories } from './import-wp-categories';
import { importTags } from './import-wp-tags';
import { importUsers } from './import-wp-users';
import { importNews } from './import-wp-news';

async function run() {
    await AppDataSource.initialize();

    await importCategories();
    await importTags();
    await importUsers();
    await importNews();

    await AppDataSource.destroy();
}

run().catch(console.error);
