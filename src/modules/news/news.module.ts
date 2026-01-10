import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsPublicController } from './news.public.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsEntity } from './entities/news.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { TagEntity } from '../tags/entities/tag.entity';
import { NewsScheduler } from './news.scheduler';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([NewsEntity, CategoryEntity, TagEntity, UserEntity]),
  ],
  controllers: [NewsController, NewsPublicController],
  providers: [NewsService, NewsScheduler],
  exports: [NewsService],
})
export class NewsModule { }
