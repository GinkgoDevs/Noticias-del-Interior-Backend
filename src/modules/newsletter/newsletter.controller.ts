import { Controller, Post, Body, BadRequestException, ConflictException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterEntity } from './newsletter.entity';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('Marketing - Newsletter')
@Controller('newsletter')
export class NewsletterController {
    constructor(
        @InjectRepository(NewsletterEntity)
        private readonly newsletterRepo: Repository<NewsletterEntity>,
    ) { }

    @Post('subscribe')
    @ApiOperation({ summary: 'Suscribirse al boletín de noticias' })
    @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string', example: 'usuario@correo.com' } } } })
    async subscribe(@Body('email') email: string) {
        if (!email || !email.includes('@')) {
            throw new BadRequestException('Email no válido');
        }

        const emailLower = email.toLowerCase();
        const existing = await this.newsletterRepo.findOneBy({ email: emailLower });

        if (existing) {
            if (existing.isActive) {
                throw new ConflictException('Este correo ya está suscrito');
            }
            existing.isActive = true;
            await this.newsletterRepo.save(existing);
            return ApiResponse.success(null, 'Te has vuelto a suscribir correctamente');
        }

        const subscription = this.newsletterRepo.create({ email: emailLower });
        await this.newsletterRepo.save(subscription);

        return ApiResponse.success(null, '¡Gracias por suscribirte al newsletter!');
    }
}
