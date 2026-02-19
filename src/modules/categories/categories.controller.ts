import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { CategoryService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@ApiTags('Taxonomía - Categorías')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  // =========================================================
  // 🌍 PUBLIC
  // =========================================================

  @Get()
  @ApiOperation({ summary: 'Listar todas las categorías activas (Público)' })
  async findPublic() {
    const items = await this.categoryService.findAll(false);
    const data = plainToInstance(CategoryResponseDto, items);
    return ApiResponse.success(data, 'Categorías obtenidas correctamente');
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obtener detalle de una categoría por su slug (Público)' })
  async findBySlug(@Param('slug') slug: string) {
    const category = await this.categoryService.findBySlug(slug);
    const data = plainToInstance(CategoryResponseDto, category);
    return ApiResponse.success(data, 'Categoría obtenida');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una categoría por su ID (Público)' })
  async findOne(@Param('id') id: string) {
    const data = await this.categoryService.findById(id);
    return ApiResponse.success(data, 'Categoría obtenida');
  }

  // =========================================================
  // 🔐 ADMIN
  // =========================================================

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Listar todas las categorías incluyendo inactivas (Admin)' })
  async findAllAdmin() {
    const items = await this.categoryService.findAll(true);
    return ApiResponse.success(items, 'Listado administrativo');
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear una nueva categoría (Admin)' })
  async create(@Body() dto: CreateCategoryDto) {
    const data = await this.categoryService.create(dto);
    return ApiResponse.success(data, 'Categoría creada');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar una categoría existente (Admin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const data = await this.categoryService.update(id, dto);
    return ApiResponse.success(data, 'Categoría actualizada');
  }

  @Patch(':id/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activar o desactivar una categoría (Admin)' })
  @ApiQuery({ name: 'value', type: Boolean, example: true })
  async setActive(
    @Param('id') id: string,
    @Query('value') value: string,
  ) {
    const data = await this.categoryService.setActive(id, value === 'true');
    return ApiResponse.success(data, `Categoría ${value === 'true' ? 'activada' : 'desactivada'}`);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar permanentemente una categoría (Admin)' })
  async remove(@Param('id') id: string) {
    await this.categoryService.remove(id);
    return ApiResponse.success(null, 'Categoría eliminada');
  }
}

