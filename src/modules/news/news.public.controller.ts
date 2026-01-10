import { Controller, Get, Param, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { PublicFindNewsDto } from './dto/public-find-news.dto';
import { plainToInstance } from 'class-transformer';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { NewsListResponseDto } from './dto/news-list-response.dto';
import { NewsResponseDto } from './dto/news-response.dto';

@Controller('news')
export class NewsPublicController {
    constructor(private readonly newsService: NewsService) { }

    @Get()
    async findAll(@Query() dto: PublicFindNewsDto) {
        const [items, total] = await this.newsService.findPublic(dto);

        // Transformar entidades a DTOs
        const data = plainToInstance(NewsListResponseDto, items);

        // Crear respuesta paginada
        const paginated = new PaginatedResponse(data, dto.page || 1, dto.limit || 10, total);

        return ApiResponse.success(paginated, 'Noticias obtenidas correctamente');
    }

    @Get('latest')
    async findLatest() {
        const items = await this.newsService.findLatest(5);
        const data = plainToInstance(NewsListResponseDto, items);
        return ApiResponse.success(data, 'Últimas noticias');
    }

    @Get('trending')
    async findTrending() {
        const items = await this.newsService.findTrending(5);
        const data = plainToInstance(NewsListResponseDto, items);
        return ApiResponse.success(data, 'Noticias más leídas');
    }

    @Get(':slug')
    async findOne(@Param('slug') slug: string) {
        const item = await this.newsService.findPublicOne(slug);
        const data = plainToInstance(NewsResponseDto, item);
        return ApiResponse.success(data, 'Detalle de noticia');
    }
}
