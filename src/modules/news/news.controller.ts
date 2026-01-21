import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    ParseUUIDPipe,
    Query,
    UseGuards,
    Delete,
} from '@nestjs/common';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { PublishNewsDto } from './dto/publish-news.dto';
import { ScheduleNewsDto } from './dto/schedule-news.dto';
import { AdminFindNewsDto } from './dto/admin-find-news.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, UserEntity } from '../users/entities/user.entity';

@Controller('admin/news')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NewsController {
    constructor(private readonly newsService: NewsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    async create(
        @Body() dto: CreateNewsDto,
        @CurrentUser() user: UserEntity,
    ) {
        const data = await this.newsService.create(dto, user.id);
        return ApiResponse.success(data, 'Noticia creada correctamente');
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateNewsDto,
    ) {
        const data = await this.newsService.update(id, dto);
        return ApiResponse.success(data, 'Noticia actualizada correctamente');
    }

    @Patch(':id/publish')
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    async publish(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: PublishNewsDto,
    ) {
        return this.newsService.publish(
            id,
            dto.publishedAt ? new Date(dto.publishedAt) : undefined,
        );
    }

    @Patch(':id/schedule')
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    async schedule(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ScheduleNewsDto,
    ) {
        return this.newsService.schedule(id, new Date(dto.scheduledAt));
    }

    @Patch(':id/archive')
    @Roles(UserRole.ADMIN)
    async archive(
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.newsService.archive(id);
    }

    @Patch(':id/restore')
    @Roles(UserRole.ADMIN)
    async restore(
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        const data = await this.newsService.restoreSoftDeleted(id);
        return ApiResponse.success(data, 'Noticia restaurada correctamente');
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        await this.newsService.remove(id);
        return { message: 'Noticia eliminada correctamente' };
    }

    @Get('dashboard')
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    async getDashboard(@CurrentUser() user: UserEntity) {
        const authorId = user.role !== UserRole.ADMIN ? user.id : undefined;
        const data = await this.newsService.getDashboardStats(authorId);
        return ApiResponse.success(data, 'Estadísticas obtenidas');
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    async findAllAdmin(@Query() dto: AdminFindNewsDto, @CurrentUser() user: UserEntity) {
        // Seguridad: Si no es admin, forzar que solo vea sus propias noticias
        if (user.role !== UserRole.ADMIN) {
            dto.authorId = user.id;
        }
        const data = await this.newsService.findAllAdmin(dto);
        return ApiResponse.success(data, 'Listado administrativo');
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        const data = await this.newsService.findById(id);
        return ApiResponse.success(data, 'Detalle de noticia');
    }
}

