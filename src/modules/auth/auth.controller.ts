import { Body, Controller, Post, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
    async login(@Body() dto: LoginDto) {
        const result = await this.authService.login(dto);
        const data = plainToInstance(AuthResponseDto, result);
        return ApiResponse.success(data, 'Login exitoso');
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
    async getProfile(@CurrentUser() user: UserEntity) {
        const data = plainToInstance(AuthUserDto, user);
        return ApiResponse.success(data, 'Perfil de usuario');
    }
}

