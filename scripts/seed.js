"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const seed_service_1 = require("../src/database/seed.service");
async function bootstrap() {
    console.log('🚀 Iniciando aplicación para seeds...\n');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const seedService = app.get(seed_service_1.SeedService);
    try {
        await seedService.runAll();
    }
    catch (error) {
        console.error('❌ Error ejecutando seeds:', error);
        process.exit(1);
    }
    await app.close();
    console.log('\n👋 Aplicación cerrada');
}
bootstrap();
//# sourceMappingURL=seed.js.map