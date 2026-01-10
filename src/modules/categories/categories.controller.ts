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

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  // =========================================================
  // 🌍 PUBLIC
  // =========================================================

  /**
   * Listado público de categorías activas
   * GET /categories
   */
  @Get()
  async findPublic() {
    const items = await this.categoryService.findAll(false);
    const data = plainToInstance(CategoryResponseDto, items);
    return ApiResponse.success(data, 'Categorías obtenidas correctamente');
  }

  // =========================================================
  // 🔐 ADMIN
  // =========================================================

  /**
   * Listado admin (incluye inactivas)
   * GET /categories/admin
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async findAllAdmin() {
    const items = await this.categoryService.findAll(true);
    // Para admin tal vez queremos ver el estado active, etc.
    // Usamos el mismo DTO por simplicidad, o podríamos extenderlo.
    // CategoryResponseDto tiene 'active'? No.
    // Si queremos active, deberiamos agregarlo o usar la entidad directa
    // Por ahora, devolvemos la entidad directa envuelta para admin
    return ApiResponse.success(items, 'Listado administrativo');
  }

  /**
   * Obtener categoría por SLUG
   * GET /categories/slug/:slug
   */
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const category = await this.categoryService.findBySlug(slug);
    const data = plainToInstance(CategoryResponseDto, category);
    return ApiResponse.success(data, 'Categoría obtenida');
  }

  /**
   * Obtener categoría por ID
   * GET /categories/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  /**
   * Crear categoría
   * POST /categories
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  /**
   * Editar categoría
   * PATCH /categories/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  /**
   * Activar / desactivar categoría
   * PATCH /categories/:id/active
   */
  @Patch(':id/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  setActive(
    @Param('id') id: string,
    @Query('value') value: string,
  ) {
    return this.categoryService.setActive(id, value === 'true');
  }

  /**
   * Eliminar categoría permanentemente
   * DELETE /categories/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.categoryService.remove(id);
    return ApiResponse.success(null, 'Categoría eliminada');
  }
}

