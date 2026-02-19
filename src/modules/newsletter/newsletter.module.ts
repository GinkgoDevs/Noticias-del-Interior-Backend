import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsletterEntity } from './newsletter.entity';
import { NewsletterController } from './newsletter.controller';

@Module({
    imports: [TypeOrmModule.forFeature([NewsletterEntity])],
    controllers: [NewsletterController],
})
export class NewsletterModule { }
