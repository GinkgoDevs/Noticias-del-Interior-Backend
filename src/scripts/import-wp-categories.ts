import { wpFetch } from './wp-client';
import { AppDataSource } from '../database/data-source';
import { CategoryEntity } from '../modules/categories/entities/category.entity';

export async function importCategories() {
    const repo = AppDataSource.getRepository(CategoryEntity);
    let page = 1;
    const perPage = 100;
    let totalImported = 0;

    while (true) {
        console.log(`📡 Fetching categories page ${page}...`);
        const categories = await wpFetch<any>(`categories?per_page=${perPage}&page=${page}&orderby=id&order=asc`);

        if (!categories || categories.length === 0) break;

        for (const cat of categories) {
            const exists = await repo.findOne({
                where: {
                    externalSource: 'wordpress',
                    externalId: String(cat.id),
                },
            });

            if (exists) continue;

            const category = repo.create({
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                active: true,
                externalSource: 'wordpress',
                externalId: String(cat.id),
            });

            await repo.save(category);
            totalImported++;
        }

        if (categories.length < perPage) break;
        page++;
    }

    console.log(`✔ Categories imported: ${totalImported}`);
}
