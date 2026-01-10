import { wpFetch } from './wp-client';
import { AppDataSource } from '../database/data-source';
import { TagEntity } from '../modules/tags/entities/tag.entity';

export async function importTags() {
    const repo = AppDataSource.getRepository(TagEntity);
    let page = 1;
    const perPage = 100;
    let totalImported = 0;

    while (true) {
        console.log(`📡 Fetching tags page ${page}...`);
        const tags = await wpFetch<any>(`tags?per_page=${perPage}&page=${page}&orderby=id&order=asc`);

        if (!tags || tags.length === 0) break;

        for (const tag of tags) {
            const exists = await repo.findOne({
                where: {
                    externalSource: 'wordpress',
                    externalId: String(tag.id),
                },
            });

            if (exists) continue;

            const tagEntity = repo.create({
                name: tag.name,
                slug: tag.slug,
                active: true,
                externalSource: 'wordpress',
                externalId: String(tag.id),
            });

            await repo.save(tagEntity);
            totalImported++;
        }

        if (tags.length < perPage) break;
        page++;
    }

    console.log(`✔ Tags imported: ${totalImported}`);
}
