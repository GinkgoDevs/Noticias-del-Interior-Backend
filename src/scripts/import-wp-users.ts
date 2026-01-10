import { wpFetch } from './wp-client';
import { AppDataSource } from '../database/data-source';
import { UserEntity, UserRole, AuthProvider } from '../modules/users/entities/user.entity';

export async function importUsers() {
    const repo = AppDataSource.getRepository(UserEntity);
    let page = 1;
    const perPage = 100;
    let totalImported = 0;

    while (true) {
        console.log(`📡 Fetching users page ${page}...`);
        const users = await wpFetch<any>(`users?per_page=${perPage}&page=${page}`);

        if (!users || users.length === 0) break;

        for (const user of users) {
            const exists = await repo.findOne({
                where: {
                    externalSource: 'wordpress',
                    externalId: String(user.id),
                },
            });

            if (exists) continue;

            const newUser = repo.create({
                name: user.name,
                username: user.slug,
                email: `${user.slug}@legacy.local`,
                role: UserRole.AUTHOR,
                authProvider: AuthProvider.LOCAL,
                authProviderId: `wp_${user.id}`,
                externalSource: 'wordpress',
                externalId: String(user.id),
            });

            await repo.save(newUser);
            totalImported++;
        }

        if (users.length < perPage) break;
        page++;
    }

    console.log(`✔ Users imported: ${totalImported}`);
}
