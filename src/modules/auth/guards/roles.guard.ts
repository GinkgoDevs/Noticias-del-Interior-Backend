import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Obtener los roles requeridos del decorador @Roles()
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Si no hay roles requeridos, permitir acceso
        if (!requiredRoles) {
            return true;
        }

        // Obtener el usuario del request (inyectado por JwtStrategy)
        const { user } = context.switchToHttp().getRequest();

        // Verificar si el usuario tiene alguno de los roles requeridos
        return requiredRoles.some((role) => user.role === role);
    }
}
