import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: TypeOrmHealthIndicator,
    ) { }

    @Get()
    @HealthCheck()
    @ApiOperation({ summary: 'Verificar el estado de salud de la API y sus dependencias' })
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
        ]);
    }
}
