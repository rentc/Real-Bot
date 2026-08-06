"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LineApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
const axios_1 = require("axios");
const LINE_API_BASE = 'https://api.line.me/v2/bot';
const LINE_DATA_API_BASE = 'https://api-data.line.me/v2/bot';
let LineApiService = LineApiService_1 = class LineApiService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(LineApiService_1.name);
        this.channelSecret = this.config.getOrThrow('LINE_CHANNEL_SECRET');
        this.channelAccessToken = this.config.getOrThrow('LINE_CHANNEL_ACCESS_TOKEN');
    }
    verifySignature(signature, rawBody) {
        if (!signature) {
            this.logger.error('Missing x-line-signature header');
            return false;
        }
        let body = rawBody;
        if (typeof rawBody === 'object' && !Buffer.isBuffer(rawBody)) {
            body = JSON.stringify(rawBody);
        }
        const expected = crypto
            .createHmac('SHA256', this.channelSecret)
            .update(body)
            .digest('base64');
        if (expected !== signature) {
            this.logger.error('Unauthorized: Signature mismatch');
            return false;
        }
        return true;
    }
    async reply(replyToken, messages) {
        try {
            await axios_1.default.post(`${LINE_API_BASE}/message/reply`, { replyToken, messages }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.channelAccessToken}`,
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to send LINE reply', error);
        }
    }
    async pushMessage(to, messages) {
        try {
            await axios_1.default.post(`${LINE_API_BASE}/message/push`, { to, messages }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.channelAccessToken}`,
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to push LINE message to ${to}`, error);
        }
    }
    async getContent(messageId) {
        const response = await axios_1.default.get(`${LINE_DATA_API_BASE}/message/${messageId}/content`, {
            headers: {
                Authorization: `Bearer ${this.channelAccessToken}`,
            },
            responseType: 'arraybuffer',
        });
        return Buffer.from(response.data);
    }
    async getGroupMemberProfile(groupId, userId) {
        try {
            const response = await axios_1.default.get(`${LINE_API_BASE}/group/${groupId}/member/${userId}`, {
                headers: {
                    Authorization: `Bearer ${this.channelAccessToken}`,
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch group member profile: ${userId} in ${groupId}`, error);
            return null;
        }
    }
    async getGroupSummary(groupId) {
        try {
            const response = await axios_1.default.get(`${LINE_API_BASE}/group/${groupId}/summary`, {
                headers: {
                    Authorization: `Bearer ${this.channelAccessToken}`,
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch group summary: ${groupId}`, error);
            return null;
        }
    }
};
exports.LineApiService = LineApiService;
exports.LineApiService = LineApiService = LineApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LineApiService);
