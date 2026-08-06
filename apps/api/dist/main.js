"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        credentials: true,
    });
    app.setGlobalPrefix('api');
    const port = process.env.API_PORT || 3000;
    const host = process.env.API_HOST || '0.0.0.0';
    await app.listen(port, host);
    logger.log(`🚀 WRC API server running on http://${host}:${port}`);
    logger.log(`📋 Health check: http://${host}:${port}/api/health`);
}
bootstrap();
