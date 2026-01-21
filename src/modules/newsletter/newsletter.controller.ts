import { Controller, Post, Body, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterEntity } from './newsletter.entity';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Controller('newsletter')
export class NewsletterController {
    constructor(
        @InjectRepository(NewsletterEntity)
        private readonly newsletterRepo: Repository<NewsletterEntity>,
    ) { }

    @Post('subscribe')
    async subscribe(@Body('email') email: string) {
        if (!email || !email.includes('@')) {
            throw new BadRequestException('Email no válido');
        }

        const existing = await this.newsletterRepo.findOneBy({ email: email.toLowerCase() });
        if (existing) {
            if (existing.isActive) {
                throw new ConflictException('Este correo ya está suscrito');
            }
            existing.isActive = true;
            await this.newsletterRepo.save(existing);
            return ApiResponse.success(null, 'Te has vuelto a suscribir correctamente');
        }

        const subscription = this.newsletterRepo.create({ email: email.toLowerCase() });
        await this.newsletterRepo.save(subscription);

        return ApiResponse.success(null, '¡Gracias por suscribirte al newsletter!');
    }
}
