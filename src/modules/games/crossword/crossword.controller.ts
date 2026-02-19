import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CrosswordService } from './crossword.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Juegos - Crucigrama')
@Controller('games/crossword')
export class CrosswordController {
    constructor(private readonly crosswordService: CrosswordService) { }

    @Get('today')
    @ApiOperation({ summary: 'Obtener el crucigrama del día de hoy' })
    async getToday() {
        console.log('--- REQUERIMIENTO DE CRUCIGRAMA RECIBIDO ---');
        const data = await this.crosswordService.getToday();
        return {
            success: true,
            data,
            message: 'Crucigrama obtenido',
            timestamp: new Date().toISOString()
        };
    }

    @Post('admin/regenerate/:date')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Forzar la regeneración de un crucigrama para una fecha específica' })
    @ApiParam({ name: 'date', example: '2026-02-01', description: 'Fecha en formato YYYY-MM-DD' })
    async regenerate(@Param('date') date: string) {
        console.log('--- REQUERIMIENTO DE REGENERACIÓN RECIBIDO ---', date);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error('Formato de fecha inválido. Usar YYYY-MM-DD');
        }
        const data = await this.crosswordService.generateForDate(date);
        return {
            success: true,
            data,
            message: 'Crucigrama regenerado',
            timestamp: new Date().toISOString()
        };
    }
}
