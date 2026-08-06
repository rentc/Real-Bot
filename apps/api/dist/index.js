"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const common_1 = require("@nestjs/common");
const express = require("express");
const https_1 = require("firebase-functions/v2/https");
const app_module_1 = require("./app.module");
let nestAppPromise = null;
async function bootstrap() {
    const expressInstance = express();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressInstance));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({ origin: true, credentials: true });
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
