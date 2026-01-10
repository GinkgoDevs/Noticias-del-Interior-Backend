import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SeedService } from '../src/database/seed.service';

async function bootstrap() {
    console.log('🚀 Iniciando aplicación para seeds...\n');

    const app = await NestFactory.createApplicationContext(AppModule);

    const seedService = app.get(SeedService);

    try {
        await seedService.runAll();
    } catch (error) {
        console.error('❌ Error ejecutando seeds:', error);
        process.exit(1);
    }

    await app.close();
    console.log('\n👋 Aplicación cerrada');
}

bootstrap();
