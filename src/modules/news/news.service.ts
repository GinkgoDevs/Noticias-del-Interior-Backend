import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { NewsEntity, NewsStatus } from './entities/news.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { TagEntity } from '../tags/entities/tag.entity';
import { UserEntity } from '../users/entities/user.entity';

import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { FindPublishedNewsOptions } from './dto/find-news.dto';
import { AdminFindNewsDto } from './dto/admin-find-news.dto';
import { PublicFindNewsDto } from './dto/public-find-news.dto';

@Injectable()
export class NewsService {
    constructor(
        @InjectRepository(NewsEntity)
        private readonly newsRepo: Repository<NewsEntity>,

        @InjectRepository(CategoryEntity)
        private readonly categoryRepo: Repository<CategoryEntity>,

        @InjectRepository(TagEntity)
        private readonly tagRepo: Repository<TagEntity>,

        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,

        @Inject(CACHE_MANAGER)
        private readonly cache: Cache,
    ) { }

    private async ensureUniqueSlug(title: string, currentSlug?: string, excludeId?: string): Promise<string> {
        let slug = currentSlug || title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const query = this.newsRepo.createQueryBuilder('news')
            .where('news.slug = :slug', { slug })
            .withDeleted();

        if (excludeId) {
            query.andWhere('news.id != :excludeId', { excludeId });
        }

        const exists = await query.getOne();

        if (exists) {
            const randomSuffix = Math.random().toString(36).substring(2, 7);
            slug = `${slug}-${randomSuffix}`;
            // Recursividad por si el slug con sufijo también existe (poco probable pero seguro)
            return this.ensureUniqueSlug(title, slug, excludeId);
        }

        return slug;
    }

    /* =========================
       CREATE
       ========================= */

    async create(
        dto: CreateNewsDto,
        authorId: string,
    ): Promise<NewsEntity> {
        const category = await this.categoryRepo.findOneBy({
            id: dto.categoryId,
        });

        if (!category) {
            throw new BadRequestException('Category not found');
        }

        const author = await this.userRepo.findOneBy({
            id: authorId,
        });

        if (!author) {
            throw new BadRequestException('Author not found');
        }

        const tags = dto.tagIds?.length
            ? await this.tagRepo.findBy({ id: In(dto.tagIds) })
            : [];

        const slug = await this.ensureUniqueSlug(dto.title, dto.slug);

        const news = this.newsRepo.create({
            title: dto.title,
            slug,
            excerpt: dto.excerpt,
            content: dto.content,
            seoTitle: dto.seoTitle,
            seoDescription: dto.seoDescription,
            canonicalUrl: dto.canonicalUrl,
            mainImageUrl: dto.mainImageUrl,
            mainImageId: dto.mainImageId,
            category,
            author,
            tags,
            status: dto.scheduledAt ? NewsStatus.DRAFT : (dto.status || NewsStatus.DRAFT),
            publishedAt: (!dto.scheduledAt && dto.status === NewsStatus.PUBLISHED) ? new Date() : null,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
            featured: dto.featured || false,
            externalId: dto.externalId,
            legacyUrl: dto.legacyUrl,
            images: dto.images?.map(img => ({
                url: img.url,
                publicId: img.publicId,
                position: img.position || 0,
                source: 'upload' as any
            })),
        });

        const saved = await this.newsRepo.save(news);

        await this.cache.clear(); // 🔥 invalidación simple

        return saved;
    }

    /* =========================
       UPDATE
       ========================= */

    async update(id: string, dto: UpdateNewsDto): Promise<NewsEntity> {
        const news = await this.newsRepo.findOne({
            where: { id },
            relations: ['tags', 'category'],
        });

        if (!news) {
            throw new NotFoundException('News not found');
        }

        if (
            news.status === NewsStatus.PUBLISHED &&
            dto.slug &&
            dto.slug !== news.slug
        ) {
            throw new ForbiddenException(
                'Cannot change slug of a published news',
            );
        }

        if (
            news.status === NewsStatus.PUBLISHED &&
            dto.status === NewsStatus.DRAFT &&
            !dto.scheduledAt // Solo prohibir si NO es para programar
        ) {
            throw new ForbiddenException(
                'Cannot revert a published news to draft unless scheduling',
            );
        }

        if (dto.categoryId) {
            const category = await this.categoryRepo.findOneBy({
                id: dto.categoryId,
            });

            if (!category) {
                throw new BadRequestException('Category not found');
            }

            news.category = category;
        }

        if (dto.tagIds) {
            news.tags = await this.tagRepo.findBy({
                id: In(dto.tagIds),
            });
        }

        if (dto.images) {
            news.images = dto.images.map(img => ({
                url: img.url,
                publicId: img.publicId,
                position: img.position || 0,
                source: 'upload' as any
            })) as any;
        }

        // Si es borrador, permitimos cambio de slug/título con validación de unicidad
        if (news.status !== NewsStatus.PUBLISHED && (dto.title || dto.slug)) {
            news.slug = await this.ensureUniqueSlug(dto.title || news.title, dto.slug, id);
        }

        const { images, slug, ...updateData } = dto;
        Object.assign(news, updateData);

        if (dto.scheduledAt) {
            // Caso 1: Programación editorial
            news.scheduledAt = new Date(dto.scheduledAt);
            news.status = NewsStatus.DRAFT;
            news.publishedAt = null;
        } else if (dto.status === NewsStatus.PUBLISHED) {
            // Caso 2: Publicación inmediata
            if (!news.publishedAt) {
                news.publishedAt = new Date();
            }
            news.scheduledAt = null;
        }

        const saved = await this.newsRepo.save(news);

        console.log('🧹 Invalidating cache after update');
        await this.cache.clear(); // Limpiar cache para que los cambios se vean instantáneamente

        return saved;
    }

    /* =========================
       PUBLICAR
       ========================= */

    async publish(
        id: string,
        publishedAt?: Date,
    ): Promise<NewsEntity> {
        const news = await this.newsRepo.findOneBy({ id });

        if (!news) {
            throw new NotFoundException('News not found');
        }

        if (news.status === NewsStatus.ARCHIVED) {
            throw new ForbiddenException(
                'Cannot publish archived news',
            );
        }

        news.status = NewsStatus.PUBLISHED;
        news.publishedAt = publishedAt ?? new Date();
        news.scheduledAt = null;

        const saved = await this.newsRepo.save(news);

        await this.cache.clear();

        return saved;
    }

    /* =========================
       PROGRAMAR
       ========================= */

    async schedule(
        id: string,
        scheduledAt: Date,
    ): Promise<NewsEntity> {
        const news = await this.newsRepo.findOneBy({ id });

        if (!news) {
            throw new NotFoundException('News not found');
        }

        if (news.status === NewsStatus.PUBLISHED) {
            throw new ForbiddenException(
                'Cannot schedule a published news',
            );
        }

        if (scheduledAt <= new Date()) {
            throw new BadRequestException(
                'Scheduled date must be in the future',
            );
        }

        news.status = NewsStatus.DRAFT;
        news.scheduledAt = scheduledAt;

        const saved = await this.newsRepo.save(news);

        await this.cache.clear();

        return saved;
    }

    /* =========================
       ARCHIVAR
       ========================= */

    async archive(id: string): Promise<NewsEntity> {
        const news = await this.newsRepo.findOneBy({ id });

        if (!news) {
            throw new NotFoundException('News not found');
        }

        if (news.status === NewsStatus.ARCHIVED) {
            return news;
        }

        news.status = NewsStatus.ARCHIVED;
        news.publishedAt = null;
        news.scheduledAt = null;
        news.featured = false;

        const saved = await this.newsRepo.save(news);

        await this.cache.clear();

        return saved;
    }

    /* =========================
       RESTAURAR
       ========================= */

    async restore(id: string): Promise<NewsEntity> {
        const news = await this.newsRepo.findOneBy({ id });

        if (!news) {
            throw new NotFoundException('News not found');
        }

        if (news.status !== NewsStatus.ARCHIVED) {
            throw new BadRequestException('News is not archived');
        }

        news.status = NewsStatus.DRAFT;

        const saved = await this.newsRepo.save(news);

        await this.cache.clear();

        return saved;
    }

    /**
     * Recupera una noticia que fue borrada (Soft Delete)
     */
    async restoreSoftDeleted(id: string): Promise<NewsEntity> {
        const news = await this.newsRepo.findOne({
            where: { id },
            withDeleted: true,
        });

        if (!news || !news.deletedAt) {
            throw new NotFoundException('Deleted news not found');
        }

        await this.newsRepo.restore(id);
        await this.cache.clear();

        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        const news = await this.findById(id);
        await this.newsRepo.softRemove(news);
        await this.cache.clear();
    }

    /* =========================
       BUSQUEDAS PUBLICAS (CACHE)
       ========================= */

    /* =========================
       BUSQUEDAS PUBLICAS (CACHE)
       ========================= */

    async findPublic(dto: PublicFindNewsDto): Promise<[NewsEntity[], number]> {
        // Cache key único por combinación de filtros
        const cacheKey = `news:public:list:${JSON.stringify(dto)}`;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const cached = await this.cache.get<[NewsEntity[], number]>(cacheKey);
        if (cached) return cached;

        const { page = 1, limit = 10, categorySlug, tagSlug, search, featured } = dto;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const qb = this.newsRepo
            .createQueryBuilder('news')
            .leftJoinAndSelect('news.category', 'category')
            .leftJoinAndSelect('news.tags', 'tags')
            .leftJoinAndSelect('news.author', 'author') // Necesario para mostrar autor
            .leftJoinAndSelect('news.images', 'images') // Traer imágenes relacionadas
            .where('news.status = :status', { status: NewsStatus.PUBLISHED })
            .andWhere('news.publishedAt <= :now', { now: new Date() }) // 🛑 NO mostrar noticias futuras
            // Priority 1: Featured news from TODAY. Priority 0: Everything else.
            .addSelect(
                `(CASE WHEN news.featured = true AND news.publishedAt >= :today THEN 1 ELSE 0 END)`,
                'priority'
            )
            .setParameters({ today })
            .orderBy('priority', 'DESC')
            .addOrderBy('news.publishedAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (featured) {
            qb.andWhere('news.featured = :featured', { featured: true });
        }

        if (categorySlug) {
            qb.andWhere('category.slug = :categorySlug', { categorySlug });
        }

        if (tagSlug) {
            qb.andWhere('tags.slug = :tagSlug', { tagSlug });
        }

        if (search) {
            qb.andWhere(
                '(news.title ILIKE :search OR news.excerpt ILIKE :search OR news.content ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (dto.date) {
            // Ajustar para que el filtrado sea exacto en hora de Argentina (UTC-3)
            // Una fecha "YYYY-MM-DD" debe abarcar desde las 00:00 hasta las 23:59 en Argentina.
            const startOfDay = new Date(`${dto.date}T00:00:00-03:00`);
            const endOfDay = new Date(`${dto.date}T23:59:59-03:00`);

            qb.andWhere('news.publishedAt >= :start AND news.publishedAt <= :end', {
                start: startOfDay,
                end: endOfDay
            });
        }

        const result = await qb.getManyAndCount();

        // Cachear por 2 minutos (balance entre frescura y performance)
        await this.cache.set(cacheKey, result, 120 * 1000);

        return result;
    }

    async findPublicOne(slug: string, ip?: string): Promise<NewsEntity> {
        const cacheKey = `news:public:detail:${slug}`;
        const cached = await this.cache.get<NewsEntity>(cacheKey);

        if (cached) {
            // 🔥 Incremento asíncrono "fire & forget" incluso en cache hit
            // No hacemos await para no bloquear la respuesta
            this.incrementView(cached.id, ip).catch(err => console.error('Error incrementing view:', err));
            return cached;
        }

        const qb = this.newsRepo.createQueryBuilder('news')
            .leftJoinAndSelect('news.category', 'category')
            .leftJoinAndSelect('news.tags', 'tags')
            .leftJoinAndSelect('news.author', 'author')
            .leftJoinAndSelect('news.images', 'images')
            .where('news.slug = :slug', { slug })
            .andWhere('news.status = :status', { status: NewsStatus.PUBLISHED })
            .andWhere('news.publishedAt <= :now', { now: new Date() });

        const news = await qb.getOne();

        if (!news) {
            throw new NotFoundException('News not found');
        }

        // 🔥 Incremento inicial
        this.incrementView(news.id, ip).catch(err => console.error('Error incrementing view:', err));

        // Cachear detalle por 5 minutos
        await this.cache.set(cacheKey, news, 300 * 1000);

        return news;
    }

    /* =========================
       METRICAS
       ========================= */

    /**
     * Incrementa el contador de vistas de forma atómica para un usuario único por IP cada 24hs
     */
    async incrementView(id: string, ip?: string): Promise<void> {
        try {
            if (ip) {
                const lockKey = `view_lock:${id}:${ip}`;
                const isLocked = await this.cache.get(lockKey);
                if (isLocked) return;

                // Bloquear por 24 horas para este par noticia:ip
                await this.cache.set(lockKey, true, 24 * 60 * 60 * 1000);
            }

            await this.newsRepo.increment({ id }, 'views', 1);
            await this.newsRepo.update(id, { lastViewedAt: new Date() });
        } catch (error) {
            // Silencioso en producción, logueamos en dev
            console.warn(`Failed to increment view for news ${id}`, error);
        }
    }

    /**
     * Obtiene las noticias "Trending" (más leídas recientemente)
     * Algoritmo: Más vistas en los últimos 7 días (o total si es muy nuevo el sitio)
     */
    async findTrending(limit: number = 5): Promise<NewsEntity[]> {
        const cacheKey = `news:public:trending:${limit}`;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const cached = await this.cache.get<NewsEntity[]>(cacheKey);
        if (cached) return cached;

        // Trending: Publicadas en los últimos 30 días, ordenadas por vistas
        const qb = this.newsRepo.createQueryBuilder('news')
            .leftJoinAndSelect('news.category', 'category')
            .leftJoinAndSelect('news.author', 'author') // Necesario para cards
            .where('news.status = :status', { status: NewsStatus.PUBLISHED })
            .andWhere('news.publishedAt <= :now', { now: new Date() }) // 🛑 NO mostrar noticias futuras
            .andWhere('news.publishedAt >= :date', { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }) // Últimos 30 días
            .orderBy('news.views', 'DESC')
            .addOrderBy('news.publishedAt', 'DESC')
            .take(limit);

        const items = await qb.getMany();

        // Cache corto para trending (1 minuto)
        await this.cache.set(cacheKey, items, 60 * 1000);

        return items;
    }

    async findLatest(limit: number = 5): Promise<NewsEntity[]> {
        const cacheKey = `news:public:latest:${limit}`;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const cached = await this.cache.get<NewsEntity[]>(cacheKey);
        if (cached) return cached;

        const qb = this.newsRepo.createQueryBuilder('news')
            .leftJoinAndSelect('news.category', 'category')
            .leftJoinAndSelect('news.author', 'author')
            .where('news.status = :status', { status: NewsStatus.PUBLISHED })
            .andWhere('news.publishedAt <= :now', { now: new Date() })
            .orderBy('news.publishedAt', 'DESC')
            .take(limit);

        const items = await qb.getMany();

        await this.cache.set(cacheKey, items, 60 * 1000); // 1 min cache

        return items;
    }

    async findById(id: string): Promise<NewsEntity> {
        const news = await this.newsRepo.findOne({
            where: { id },
            relations: ['category', 'tags', 'author', 'images'],
        });

        if (!news) {
            throw new NotFoundException('News not found');
        }

        return news;
    }

    /* =========================
       BUSQUEDA ADMIN (NO CACHE)
       ========================= */

    async findAllAdmin(dto: AdminFindNewsDto) {
        const {
            status,
            categoryId,
            authorId,
            featured,
            search,
            dateFrom,
            dateTo,
            page = 1,
            limit = 20,
            withDeleted = false,
        } = dto;

        const qb = this.newsRepo
            .createQueryBuilder('news')
            .leftJoinAndSelect('news.category', 'category')
            .leftJoinAndSelect('news.author', 'author')
            .leftJoinAndSelect('news.tags', 'tags')
            .orderBy('news.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (withDeleted) {
            qb.withDeleted();
        }

        if (status) qb.andWhere('news.status = :status', { status });
        if (categoryId) qb.andWhere('category.id = :categoryId', { categoryId });
        if (authorId) qb.andWhere('author.id = :authorId', { authorId });
        if (featured !== undefined) qb.andWhere('news.featured = :featured', { featured });

        if (search) {
            qb.andWhere(
                '(news.title ILIKE :search OR news.excerpt ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        if (dateFrom) {
            qb.andWhere('news.createdAt >= :dateFrom', {
                dateFrom: new Date(dateFrom),
            });
        }

        if (dateTo) {
            qb.andWhere('news.createdAt <= :dateTo', {
                dateTo: new Date(dateTo),
            });
        }

        const [items, total] = await qb.getManyAndCount();

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getDashboardStats(authorId?: string) {
        const query = this.newsRepo.createQueryBuilder('news');

        if (authorId) {
            query.where('news.authorId = :authorId', { authorId });
        }

        const statsQuery = query.clone();

        const [total, published, draft, recent, totalViews, mostViewed, viewsByCategory] = await Promise.all([
            query.getCount(),
            query.clone().andWhere('news.status = :published', { published: NewsStatus.PUBLISHED }).getCount(),
            query.clone().andWhere('news.status = :draft', { draft: NewsStatus.DRAFT }).getCount(),
            query.clone()
                .leftJoinAndSelect('news.category', 'category')
                .leftJoinAndSelect('news.author', 'author')
                .orderBy('news.createdAt', 'DESC')
                .take(5)
                .getMany(),
            // Total views
            statsQuery.select('SUM(news.views)', 'sum').getRawOne().then(res => parseInt(res?.sum || '0')),
            // Most viewed (top 5)
            query.clone()
                .leftJoinAndSelect('news.category', 'category')
                .andWhere('news.status = :published', { published: NewsStatus.PUBLISHED })
                .orderBy('news.views', 'DESC')
                .take(5)
                .getMany(),
            // Views by category
            query.clone()
                .select('category.name', 'name')
                .addSelect('SUM(news.views)', 'views')
                .leftJoin('news.category', 'category')
                .groupBy('category.name')
                .getRawMany()
        ]);

        return {
            total,
            published,
            draft,
            recent,
            totalViews,
            mostViewed,
            viewsByCategory: viewsByCategory.map(v => ({
                name: v.name || 'Sin categoría',
                views: parseInt(v.views || '0')
            }))
        };
    }
}
