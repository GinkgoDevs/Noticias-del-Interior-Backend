import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { NewsEntity, NewsStatus } from './entities/news.entity';

@Injectable()
export class NewsScheduler {
    private readonly logger = new Logger(NewsScheduler.name);

    constructor(
        @InjectRepository(NewsEntity)
        private readonly newsRepo: Repository<NewsEntity>,
    ) { }

    /**
     * ⏱ Corre cada minuto
     * Publica noticias programadas
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async publishScheduledNews() {
        const now = new Date();

        const scheduledNews = await this.newsRepo.find({
            where: {
                status: NewsStatus.DRAFT,
                scheduledAt: LessThanOrEqual(now),
            },
        });

        if (!scheduledNews.length) return;

        for (const news of scheduledNews) {
            news.status = NewsStatus.PUBLISHED;
            news.publishedAt = news.scheduledAt;
            news.scheduledAt = null;

            await this.newsRepo.save(news);

            this.logger.log(
                `📰 Publicada automáticamente: ${news.title}`,
            );
        }
    }
}
