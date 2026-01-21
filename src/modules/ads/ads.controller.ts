import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AdsService } from './ads.service';
import { CreateAdDto, UpdateAdDto } from './dto/create-ad.dto';
import { AdPosition } from './entities/ad.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('ads')
export class AdsController {
    constructor(private readonly adsService: AdsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    create(@Body() createAdDto: CreateAdDto) {
        return this.adsService.create(createAdDto);
    }

    @Get('admin/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.adsService.findAll();
    }

    @Get('active')
    findActive(@Query('position') position: AdPosition) {
        return this.adsService.findActive(position);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.adsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateAdDto: UpdateAdDto) {
        return this.adsService.update(id, updateAdDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.adsService.remove(id);
    }

    @Post(':id/view')
    recordView(@Param('id') id: string) {
        return this.adsService.recordView(id);
    }

    @Post(':id/click')
    recordClick(@Param('id') id: string) {
        return this.adsService.recordClick(id);
    }
}
