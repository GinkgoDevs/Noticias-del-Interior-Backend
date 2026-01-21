import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class AppController {
    constructor(private dataSource: DataSource) { }

    @Get()
    async check() {
        const isDbConnected = this.dataSource.isInitialized;

        return {
            status: isDbConnected ? 'ok' : 'error',
            timestamp: new Date().toISOString(),
            services: {
                database: isDbConnected ? 'up' : 'down',
                api: 'up',
            },
        };
    }
}
