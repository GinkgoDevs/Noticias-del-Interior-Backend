import { config } from 'dotenv';
config();
import { DataSource } from 'typeorm';
import { parse } from 'pg-connection-string';
import { join } from 'path';
const isProd = process.env.NODE_ENV === 'production';

const DATABASE_URL = process.env.DATABASE_URL;
const parsed = DATABASE_URL ? parse(DATABASE_URL) : null;

export const AppDataSource = new DataSource({
    type: 'postgres',

    host: parsed?.host || process.env.DB_HOST || 'localhost',
    port: Number(parsed?.port || process.env.DB_PORT || 5432),

    username: parsed?.user || process.env.DB_USER || 'postgres',
    password: String(parsed?.password || process.env.DB_PASSWORD || '123'),
    database: String(parsed?.database || process.env.DB_NAME || 'noticias'),

    synchronize: false,
    logging: !!process.env.DEBUG,

    ssl:
        process.env.DB_SSL === 'true' ||
            /render\.com|supabase|neon|vercel/.test(DATABASE_URL || '')
            ? { rejectUnauthorized: false }
            : undefined,

    entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '/migrations/*{.ts,.js}')],
});
