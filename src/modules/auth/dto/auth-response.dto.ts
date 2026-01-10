import { Expose, Type } from 'class-transformer';

export class AuthUserDto {
    @Expose() id: string;
    @Expose() email: string;
    @Expose() name: string;
    @Expose() role: string;
    @Expose() avatarUrl?: string;
    @Expose() active: boolean;
}

export class AuthResponseDto {
    @Expose()
    accessToken: string;

    @Expose()
    @Type(() => AuthUserDto)
    user: AuthUserDto;
}
