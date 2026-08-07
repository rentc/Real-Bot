"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const common_1 = require("@nestjs/common");
const express = require("express");
const https_1 = require("firebase-functions/v2/https");
const app_module_1 = require("./app.module");
const helmet_1 = require("helmet");
const swagger_1 = require("@nestjs/swagger");
let nestAppPromise = null;
async function bootstrap() {
    const expressInstance = express();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressInstance));
    app.use((0, helmet_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('api');
    app.enableCors({ origin: true, credentials: true });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('WRC AI Sales Platform API')
        .setDescription('The API documentation for WRC')
        .setVersion('1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.init();
    return expressInstance;
}
exports.api = (0, https_1.onRequest)({ region: 'asia-northeast1' }, async (req, res) => {
    if (!nestAppPromise) {
        nestAppPromise = bootstrap();
    }
    const app = await nestAppPromise;
    return app(req, res);
});
