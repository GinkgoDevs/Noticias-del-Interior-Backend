import { Controller, Post, Body, Get, UseGuards, Delete, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from "./tags.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApiResponse } from "../../common/dto/api-response.dto";

@ApiTags('Taxonomía - Etiquetas (Tags)')
@ApiBearerAuth()
@Controller('admin/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsController {
    constructor(private readonly tagsService: TagsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    @ApiOperation({ summary: 'Crear una nueva etiqueta' })
    async create(@Body() dto: CreateTagDto) {
        const data = await this.tagsService.create(dto);
        return ApiResponse.success(data, 'Etiqueta creada');
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.EDITOR)
    @ApiOperation({ summary: 'Listar todas las etiquetas' })
    async findAll() {
        const data = await this.tagsService.findAll();
        return ApiResponse.success(data, 'Etiquetas obtenidas');
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Eliminar una etiqueta' })
    async remove(@Param('id') id: string) {
        await this.tagsService.remove(id);
        return ApiResponse.success(null, 'Etiqueta eliminada');
    }
}

