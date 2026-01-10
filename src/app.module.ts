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
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    ScheduleModule.forRoot()
  ],
})
export class AppModule { }

