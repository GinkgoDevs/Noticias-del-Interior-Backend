import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { CrosswordService } from './crossword.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Controller('games/crossword')
export class CrosswordController {
    constructor(private readonly crosswordService: CrosswordService) { }

    @Get('today')
    async getToday() {
        console.log('--- REQUERIMIENTO DE CRUCIGRAMA RECIBIDO ---');
        try {
            const data = await this.crosswordService.getToday();
            console.log('--- CRUCIGRAMA GENERADO/OBTENIDO EXITOSAMENTE ---');
            return {
                success: true,
                data,
                message: 'Crucigrama obtenido',
                timestamp: new Date().toISOString()
            };
        } catch (error: any) {
            console.error('--- ERROR EN GET TODAY ---', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    @Post('admin/regenerate/:date')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
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
