
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'super_secret_key_change_me_in_production',
        });
    }

    async validate(payload: any) {
        console.log('[JwtStrategy] Validating payload:', payload);
        const { sub: id } = payload;
        const user = await this.userRepo.findOneBy({ id });

        if (!user) {
            console.error(`[JwtStrategy] User not found for ID: ${id}`);
            throw new UnauthorizedException();
        }

        console.log(`[JwtStrategy] User found: ${user.email}`);

        if (!user.active) {
            throw new UnauthorizedException('User is inactive');
        }

        // Inyectamos el usuario completo en req.user
        return user;
    }
}
