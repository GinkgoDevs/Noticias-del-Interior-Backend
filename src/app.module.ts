import { Module } from "@nestjs/common";
import { CacheModule } from '@nestjs/cache-manager';
import { DatabaseModule } from "./database/database.module";
import { SeedModule } from './database/seed.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoryModule } from './modules/categories/categories.module';
import { NewsModule } from './modules/news/news.module';
import { TagsModule } from './modules/tags/tags.module';
import { UploadModule } from './modules/upload/upload.module';
import { GamesModule } from './modules/games/games.module';
import { AdsModule } from './modules/ads/ads.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { HealthModule } from './modules/health/health.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { envValidationSchema } from './config/env.validation';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),
    CacheModule.register({
      ttl: 60,
      max: 1000,
      isGlobal: true,
    }),
    DatabaseModule,
    SeedModule,
    AuthModule,
    UsersModule,
    CategoryModule,
    NewsModule,
    TagsModule,
    UploadModule,
    GamesModule,
    AdsModule,
    NewsletterModule,
    HealthModule,
    ScheduleModule.forRoot()
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }

