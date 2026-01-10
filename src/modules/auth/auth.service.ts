import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly jwtService: JwtService,
    ) { }

    async login(dto: LoginDto) {
        // 1. Buscar usuario con passwordHash (que está marcado como select: false)
        const user = await this.userRepo
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.email = :email', { email: dto.email })
            .getOne();

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!user.active) {
            throw new UnauthorizedException('Usuario inactivo');
        }

        // 2. No todas las cuentas de WP traen pass, o quizás usen OAuth.
        // Solo permitimos auth local si existe passwordHash.
        if (!user.passwordHash) {
            throw new UnauthorizedException('Esta cuenta requiere otro método de autenticación');
        }

        // 3. Comparar bcrypt
        const isMatched = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatched) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // 4. Generar Token
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };

        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl
            }
        };
    }
}
