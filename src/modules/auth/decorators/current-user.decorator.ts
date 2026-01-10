import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '../../users/entities/user.entity';

/**
 * Decorador para obtener el usuario autenticado del request
 * Uso: @CurrentUser() user: UserEntity
 */
export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): UserEntity => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
