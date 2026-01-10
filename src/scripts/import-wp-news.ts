import { wpFetch } from './wp-client';
import { AppDataSource } from '../database/data-source';
import { NewsEntity, NewsStatus } from '../modules/news/entities/news.entity';
import { CategoryEntity } from '../modules/categories/entities/category.entity';
import { TagEntity } from '../modules/tags/entities/tag.entity';
import { UserEntity } from '../modules/users/entities/user.entity';
import { NewsImageEntity } from '../modules/news/entities/news-image.entity';
import { uploadToCloudinary } from './cloudinary-client';

/**
 * Elimina TODOS los tags HTML y deja solo texto plano.
 * Útil para excerpt y SEO description.
 */
function stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, ' ').trim();
}

/**
 * Limpia el HTML ruidoso de WordPress pero mantiene estructura básica (párrafos).
 */
function cleanHtml(html: string): string {
    if (!html) return '';

    let clean = html
        // 1. Eliminar contenedores/wrappers (cualquier div)
        .replace(/<div[^>]*>/gi, '')
        .replace(/<\/div>/gi, '')

        // 2. Títulos en el body: Convertir h1-h6 en <p><strong> para no afectar SEO de la página
        .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '<p><strong>$1</strong></p>')

        // 3. Spans: Eliminarlos pero dejar el texto
        .replace(/<span[^>]*>(.*?)<\/span>/gi, '$1')

        // 4. Limpiar atributos de los párrafos (dejar solo <p>)
        .replace(/<p[^>]*>/gi, '<p>')

        // 5. Eliminar tributos sucios (estilos, clases, srcset, sizes, dimensiones) de CUALQUIER tag
        .replace(/ (style|class|data-[a-z0-9-]+|srcset|sizes|loading|decoding|width|height|aria-[a-z-]+)=["'][^"']*["']/gi, '')

        // 6. Limpieza final de atributos vacíos que pudieran quedar (ej class="")
        .replace(/ (style|class|srcset)=["']["']/gi, '');

    // 7. Limpieza final de espacios y entidades
    return clean
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/<p>\s*<\/p>/gi, '') // Eliminar párrafos vacíos
        .trim();
}

export async function importNews() {
    const newsRepo = AppDataSource.getRepository(NewsEntity);
    const catRepo = AppDataSource.getRepository(CategoryEntity);
    const tagRepo = AppDataSource.getRepository(TagEntity);
    const userRepo = AppDataSource.getRepository(UserEntity);
    const imageRepo = AppDataSource.getRepository(NewsImageEntity);

    let page = 1;
    const perPage = 100;
    let totalImported = 0;

    while (true) {
        console.log(`📡 Fetching news page ${page}...`);
        const posts = await wpFetch<any>(`posts?per_page=${perPage}&page=${page}&orderby=id&order=asc`);

        if (!posts || posts.length === 0) break;

        for (const post of posts) {
            let news = await newsRepo.findOne({
                where: {
                    externalSource: 'wordpress',
                    externalId: String(post.id),
                },
                relations: ['tags', 'images']
            });

            // 1. Relaciones Básicas
            const category = await catRepo.findOne({
                where: {
                    externalSource: 'wordpress',
                    externalId: String(post.categories[0]),
                },
            });

            const author = await userRepo.findOne({
                where: {
                    externalSource: 'wordpress',
                    externalId: String(post.author),
                },
            });

            const tags = post.tags.length
                ? await tagRepo.findBy({
                    externalId: post.tags.map((id: number) => String(id)),
                })
                : [];

            // 2. Procesar Contenido e Imágenes
            let contentProcessed = cleanHtml(post.content.rendered);
            const contentImages: Partial<NewsImageEntity>[] = [];

            // Regex Ultra-Robusto: 
            // - Captura bloque entero (Link + Img) O (Solo Img)
            // - Captura HREF (Group 2)
            // - Captura SRC (Group 3)
            // - Acepta comillas dobles o simples
            const imgRegex = /((?:<a[^>]*href=["']([^"']+)["'][^>]*>\s*)?<img[^>]*src=["']([^"']+)["'][^>]*>(?:\s*<\/a>)?)/gi;

            let match;
            const imagesToProcess = [];

            while ((match = imgRegex.exec(contentProcessed)) !== null) {
                imagesToProcess.push({
                    fullMatch: match[1],
                    hrefUrl: match[2],
                    srcUrl: match[3]
                });
            }

            // Procesamos imágenes
            for (let i = 0; i < imagesToProcess.length; i++) {
                const item = imagesToProcess[i];

                // Determinar la mejor URL:
                // Si el HREF apunta a una imagen (jpg/png/etc), usarlo como fuente de alta calidad.
                // Si no, usar el SRC.
                const isHrefImage = item.hrefUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.hrefUrl);
                const targetUrl = isHrefImage ? item.hrefUrl : item.srcUrl;

                // Solo subimos si es válida y NO es ya de Cloudinary
                if (targetUrl && !targetUrl.includes('cloudinary.com')) {
                    try {
                        const uploaded = await uploadToCloudinary(targetUrl, 'noticias/content');
                        if (uploaded) {
                            // Reemplazamos EL BLOQUE ENTERO por la nueva <img> limpia
                            // Usamos split/join para mayor seguridad si el string aparece varias veces
                            contentProcessed = contentProcessed.split(item.fullMatch).join(`<img src="${uploaded.url}" />`);

                            contentImages.push({
                                publicId: uploaded.publicId,
                                url: uploaded.url,
                                source: 'content',
                                position: i
                            });
                        }
                    } catch (e) {
                        // Silent fail
                    }
                } else if (targetUrl && targetUrl.includes('cloudinary.com')) {
                    // Si YA es de Cloudinary (ej: re-corrida del script correcta), asegurarnos que el HTML esté limpio (sin <a> wrapper)
                    // Si el fullMatch tiene un <a>, lo limpiamos también.
                    if (item.fullMatch.includes('<a')) {
                        contentProcessed = contentProcessed.split(item.fullMatch).join(`<img src="${targetUrl}" />`);
                    }
                }
            }

            // 3. Imagen Destacada (Main/Cover)
            let mainImageUrl: string | undefined = news?.mainImageUrl;
            let mainImageId: string | undefined = news?.mainImageId;

            // Si no tiene imagen principal, buscamos la Featured de WP
            if (!mainImageUrl && post.featured_media && post.featured_media > 0) {
                try {
                    const media = await wpFetch<any>(`media/${post.featured_media}`);
                    // @ts-ignore
                    const sourceUrl = media.source_url || media?.guid?.rendered;

                    if (sourceUrl) {
                        const uploaded = await uploadToCloudinary(sourceUrl, 'noticias/covers');
                        if (uploaded) {
                            mainImageUrl = uploaded.url;
                            mainImageId = uploaded.publicId;
                        }
                    }
                } catch (error) {
                    // Fail silent
                }
            }

            // Fallback: Si no hay featured, usar la PRIMERA del contenido
            if (!mainImageUrl && contentImages.length > 0) {
                mainImageUrl = contentImages[0].url;
                mainImageId = contentImages[0].publicId;
                console.log(`  ↳ Fallback Main Image for ${post.id}`);
            }

            // 4. Preparar Datos (SEO y Limpieza)
            const yoast = post.yoast_head_json || {};
            const seoTitle = yoast.title || yoast.og_title || post.title.rendered;
            const seoDescription = yoast.description || yoast.og_description || stripHtml(post.excerpt.rendered);
            const canonicalUrl = yoast.canonical || undefined;

            const cleanExcerpt = stripHtml(post.excerpt.rendered);
            const publishedAt = new Date(post.date_gmt + 'Z');
            const updatedAt = new Date(post.modified_gmt + 'Z');

            if (news) {
                // UPDATE
                news.title = post.title.rendered;
                news.slug = post.slug;
                news.excerpt = cleanExcerpt;
                news.content = contentProcessed;
                news.seoTitle = seoTitle;
                news.seoDescription = seoDescription;
                news.canonicalUrl = canonicalUrl;
                news.mainImageUrl = mainImageUrl;
                news.mainImageId = mainImageId;
                news.updatedAt = updatedAt;
                if (category) news.category = category;
                if (author) news.author = author;
                news.tags = tags;

                await newsRepo.save(news);

                // Guardar imágenes del contenido vinculadas
                for (const img of contentImages) {
                    const existsImg = await imageRepo.findOneBy({ url: img.url, news: { id: news.id } });
                    if (!existsImg) {
                        // @ts-ignore
                        const newImg = imageRepo.create({ ...img, news });
                        await imageRepo.save(newImg);
                    }
                }

                console.log(`↺ Updated: ${news.id}`);
            } else {
                // CREATE
                news = newsRepo.create({
                    title: post.title.rendered,
                    slug: post.slug,
                    excerpt: cleanExcerpt,
                    content: contentProcessed,
                    status: NewsStatus.PUBLISHED,
                    publishedAt: publishedAt,
                    createdAt: publishedAt,
                    updatedAt: updatedAt,
                    externalSource: 'wordpress',
                    externalId: String(post.id),
                    legacyUrl: post.link,
                    importedAt: new Date(),
                    category: category || undefined,
                    author: author || undefined,
                    tags,
                    mainImageUrl,
                    mainImageId,
                    featured: false,
                    seoTitle,
                    seoDescription,
                    canonicalUrl,
                });

                const savedNews = await newsRepo.save(news);

                // Guardar imágenes del contenido vinculadas
                for (const img of contentImages) {
                    // @ts-ignore
                    const newImg = imageRepo.create({ ...img, news: savedNews });
                    await imageRepo.save(newImg);
                }
                console.log(`★ Created: ${news.slug}`);
            }

            totalImported++;
        }

        if (posts.length < perPage) break;
        page++;
    }

    console.log(`✔ News imported: ${totalImported}`);
}
