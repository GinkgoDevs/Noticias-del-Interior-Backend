import { Controller, Get, Param, Query, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { PublicFindNewsDto } from './dto/public-find-news.dto';
import { plainToInstance } from 'class-transformer';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { NewsListResponseDto } from './dto/news-list-response.dto';
import { NewsResponseDto } from './dto/news-response.dto';

@ApiTags('Public - Noticias')
@Controller('news')
export class NewsPublicController {
    constructor(private readonly newsService: NewsService) { }

    @Get()
    @ApiOperation({ summary: 'Obtener listado público de noticias con paginación y filtros' })
    async findAll(@Query() dto: PublicFindNewsDto) {
        const [items, total] = await this.newsService.findPublic(dto);

        // Transformar entidades a DTOs
        const data = plainToInstance(NewsListResponseDto, items);

        // Crear respuesta paginada
        const paginated = new PaginatedResponse(data, dto.page || 1, dto.limit || 10, total);

        return ApiResponse.success(paginated, 'Noticias obtenidas correctamente');
    }

    @Get('latest')
    @ApiOperation({ summary: 'Obtener las 5 noticias más recientes' })
    async findLatest() {
        const items = await this.newsService.findLatest(5);
        const data = plainToInstance(NewsListResponseDto, items);
        return ApiResponse.success(data, 'Últimas noticias');
    }

    @Get('trending')
    @ApiOperation({ summary: 'Obtener las 5 noticias más leídas (Trending)' })
    async findTrending() {
        const items = await this.newsService.findTrending(5);
        const data = plainToInstance(NewsListResponseDto, items);
        return ApiResponse.success(data, 'Noticias más leídas');
    }

    @Get(':slug')
    @ApiOperation({ summary: 'Obtener detalle de una noticia pública por su slug' })
    async findOne(@Param('slug') slug: string, @Ip() ip: string) {
        const item = await this.newsService.findPublicOne(slug, ip);
        const data = plainToInstance(NewsResponseDto, item);
        return ApiResponse.success(data, 'Detalle de noticia');
    }
}
