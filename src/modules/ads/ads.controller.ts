import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { CreateAdDto, UpdateAdDto } from './dto/create-ad.dto';
import { AdPosition } from './entities/ad.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Publicidad (Ads)')
@Controller('ads')
export class AdsController {
    constructor(private readonly adsService: AdsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Crear una nueva publicidad (Admin)' })
    create(@Body() createAdDto: CreateAdDto) {
        return this.adsService.create(createAdDto);
    }

    @Get('admin/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Listar todas las publicidades (Admin)' })
    findAll() {
        return this.adsService.findAll();
    }

    @Get('active')
    @ApiOperation({ summary: 'Obtener publicidades activas por posición' })
    @ApiQuery({ name: 'position', enum: AdPosition })
    findActive(@Query('position') position: AdPosition) {
        return this.adsService.findActive(position);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener detalle de una publicidad' })
    findOne(@Param('id') id: string) {
        return this.adsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Actualizar una publicidad existente (Admin)' })
    update(@Param('id') id: string, @Body() updateAdDto: UpdateAdDto) {
        return this.adsService.update(id, updateAdDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Eliminar una publicidad (Admin)' })
    remove(@Param('id') id: string) {
        return this.adsService.remove(id);
    }

    @Post(':id/view')
    @ApiOperation({ summary: 'Registrar una visualización de publicidad' })
    recordView(@Param('id') id: string) {
        return this.adsService.recordView(id);
    }

    @Post(':id/click')
    @ApiOperation({ summary: 'Registrar un clic en una publicidad' })
    recordClick(@Param('id') id: string) {
        return this.adsService.recordClick(id);
    }
}
