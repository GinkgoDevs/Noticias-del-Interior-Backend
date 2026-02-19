import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('Admin - Usuarios')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Listar todos los usuarios (solo Admin)' })
    async findAll() {
        const users = await this.usersService.findAll();
        return ApiResponse.success(users, 'Usuarios obtenidos correctamente');
    }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Crear un nuevo usuario manualmente (solo Admin)' })
    async create(@Body() body: any) {
        const user = await this.usersService.create(body);
        return ApiResponse.success(user, 'Usuario creado correctamente');
    }

    @Patch(':id/role')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Cambiar el rol de un usuario (solo Admin)' })
    @ApiBody({ schema: { type: 'object', properties: { role: { type: 'string', enum: Object.values(UserRole) } } } })
    async updateRole(@Param('id') id: string, @Body('role') role: string) {
        await this.usersService.updateRole(id, role);
        return ApiResponse.success(null, 'Rol actualizado correctamente');
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Eliminar un usuario (solo Admin)' })
    async remove(@Param('id') id: string) {
        await this.usersService.remove(id);
        return ApiResponse.success(null, 'Usuario eliminado correctamente');
    }
}
