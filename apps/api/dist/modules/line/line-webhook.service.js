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
var LineWebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineWebhookService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../shared/firebase/firebase.service");
const line_api_service_1 = require("./line-api.service");
const ai_service_1 = require("../../shared/ai/ai.service");
const sessions_service_1 = require("../sessions/sessions.service");
const quotations_service_1 = require("../quotations/quotations.service");
let LineWebhookService = LineWebhookService_1 = class LineWebhookService {
    constructor(firebase, lineApi, aiService, sessionsService, quotationsService) {
        this.firebase = firebase;
        this.lineApi = lineApi;
        this.aiService = aiService;
        this.sessionsService = sessionsService;
        this.quotationsService = quotationsService;
        this.logger = new common_1.Logger(LineWebhookService_1.name);
    }
    async processEvent(event) {
        if (event.webhookEventId) {
            const existing = await this.firebase.db.collection('webhookEvents').doc(event.webhookEventId).get();
            if (existing.exists) {
                this.logger.debug(`Duplicate webhook event skipped: ${event.webhookEventId}`);
                return;
            }
        }
        if (event.webhookEventId) {
            await this.firebase.db.collection('webhookEvents').doc(event.webhookEventId).set({
                webhookEventId: event.webhookEventId,
                eventType: event.type,
                lineGroupId: event.source.groupId || null,
                lineUserId: event.source.userId || null,
                status: 'PROCESSING',
                processedAt: new Date(),
            });
        }
        try {
            switch (event.type) {
                case 'join':
                    await this.handleBotJoinGroup(event);
                    break;
                case 'leave':
                    await this.handleBotLeaveGroup(event);
                    break;
                case 'memberJoined':
                    await this.handleMemberJoined(event);
                    break;
                case 'message':
                    await this.handleMessage(event);
                    break;
                case 'follow':
                    this.logger.log(`User followed bot: ${event.source.userId}`);
                    break;
                case 'unfollow':
                    this.logger.log(`User unfollowed bot: ${event.source.userId}`);
                    break;
                default:
                    this.logger.debug(`Unhandled event type: ${event.type}`);
            }
            if (event.webhookEventId) {
                await this.firebase.db.collection('webhookEvents').doc(event.webhookEventId).update({
                    status: 'PROCESSED',
                });
            }
        }
        catch (error) {
            if (event.webhookEventId) {
                await this.firebase.db.collection('webhookEvents').doc(event.webhookEventId).update({
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : String(error),
                });
            }
            throw error;
        }
    }
    async handleBotJoinGroup(event) {
        const groupId = event.source.groupId;
        if (!groupId)
            return;
        this.logger.log(`Bot joined group: ${groupId}`);
        const groupSummary = await this.lineApi.getGroupSummary(groupId);
        await this.firebase.db.collection('lineGroups').doc(groupId).set({
            lineGroupId: groupId,
            groupName: groupSummary?.groupName || null,
            status: 'PENDING_CONFIGURATION',
            botJoinedAt: new Date(),
            updatedAt: new Date(),
        }, { merge: true });
        if (event.replyToken) {
            await this.lineApi.reply(event.replyToken, [
                {
                    type: 'text',
                    text: '🤖 สวัสดีครับ ผมคือ WRC Sales Bot\n\nผมพร้อมช่วยเรื่องใบเสนอราคา สอบถามราคา และติดตามสถานะคำสั่งซื้อ\n\nพิมพ์ "ขอราคา NYY 4x6 100 เมตร" หรือใช้คำสั่ง #quote ได้เลยครับ',
                },
            ]);
        }
    }
    async handleBotLeaveGroup(event) {
        const groupId = event.source.groupId;
        if (!groupId)
            return;
        this.logger.log(`Bot left group: ${groupId}`);
        await this.firebase.db.collection('lineGroups').doc(groupId).update({
            status: 'INACTIVE',
            updatedAt: new Date(),
        });
    }
    async handleMemberJoined(event) {
        const groupId = event.source.groupId;
        if (!groupId || !event.joined?.members)
            return;
        for (const member of event.joined.members) {
            if (member.type !== 'user')
                continue;
            const profile = await this.lineApi.getGroupMemberProfile(groupId, member.userId);
            await this.firebase.db.collection('lineUsers').doc(member.userId).set({
                lineUserId: member.userId,
                displayName: profile?.displayName || null,
                pictureUrl: profile?.pictureUrl || null,
                updatedAt: new Date(),
            }, { merge: true });
            const groupRef = this.firebase.db.collection('lineGroups').doc(groupId);
            await groupRef.collection('memberships').doc(member.userId).set({
                lineUserId: member.userId,
                lineGroupId: groupId,
                isActive: true,
                leftAt: null,
                updatedAt: new Date(),
            }, { merge: true });
        }
    }
    async handleMessage(event) {
        if (event.source.type !== 'group')
            return;
        const groupId = event.source.groupId;
        const userId = event.source.userId;
        if (!groupId || !userId)
            return;
        await this.upsertSender(groupId, userId);
        const message = event.message;
        if (!message)
            return;
        const isRelevant = this.isRelevantMessage(message);
        if (!isRelevant) {
            return;
        }
        if (message.type === 'text' && message.text) {
            await this.handleTextMessage(event, message.text, groupId, userId);
        }
    }
    isRelevantMessage(message) {
        if (!message)
            return false;
        if (message.mention?.mentionees?.some((m) => m.type === 'all' || m.userId === 'bot')) {
            return true;
        }
        if (message.type === 'text' && message.text) {
            const text = message.text.trim().toLowerCase();
            const commands = ['#quote', '#price', '#stock', '#order', '#delivery', '#approve', '#status'];
            if (commands.some((cmd) => text.startsWith(cmd))) {
                return true;
            }
            const businessKeywords = ['ราคา', 'เช็คสต๊อก'];
            if (businessKeywords.some((kw) => text.includes(kw))) {
                return true;
            }
        }
        return false;
    }
    async handleTextMessage(event, text, groupId, userId) {
        if (event.replyToken) {
            await this.sessionsService.upsertSession(groupId, userId, { lastMessage: text });
            const extraction = await this.aiService.extractQuotationRequest(text);
            if (extraction.intent === 'QUOTE' || extraction.intent === 'PRICE' || text.includes('ราคา')) {
                if (extraction.items && extraction.items.length > 0) {
                    try {
                        const tenantId = 'tenant_wrc_main';
                        const quote = await this.quotationsService.generateDraftQuotation(tenantId, groupId, userId, extraction.items);
                        let replyText = `📝 สร้างใบเสนอราคา (Draft) เรียบร้อยแล้ว\n`;
                        replyText += `หมายเลขอ้างอิง: ${quote.id}\n\n`;
                        replyText += `รายการ:\n`;
                        const formatCurrency = (amount) => {
                            return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        };
                        for (const item of quote.items) {
                            replyText += `- ${item.name} x ${item.quantity} = ${formatCurrency(item.total)} บาท\n`;
                        }
                        replyText += `\nยอดรวม: ${formatCurrency(quote.subtotal)} บาท\n`;
                        replyText += `VAT 7%: ${formatCurrency(quote.vat)} บาท\n`;
                        replyText += `ยอดสุทธิ: ${formatCurrency(quote.grandTotal)} บาท\n\n`;
                        replyText += `แอดมินสามารถตรวจสอบและอนุมัติผ่านระบบหลังบ้านครับ`;
                        await this.lineApi.reply(event.replyToken, [{ type: 'text', text: replyText }]);
                    }
                    catch (e) {
                        this.logger.error('Error generating quotation', e);
                        await this.lineApi.reply(event.replyToken, [{ type: 'text', text: 'เกิดข้อผิดพลาดในการสร้างใบเสนอราคา กรุณาลองใหม่อีกครั้ง' }]);
                    }
                }
                else {
                    await this.lineApi.reply(event.replyToken, [
                        {
                            type: 'text',
                            text: 'ผมไม่พบข้อมูลสินค้าที่ต้องการขอราคา กรุณาระบุ ชนิด ขนาด และจำนวน เช่น "ขอราคา NYY 4x6 100 เมตร"',
                        },
                    ]);
                }
            }
            else {
                await this.lineApi.reply(event.replyToken, [
                    {
                        type: 'text',
                        text: '🤖 รับทราบครับ หากต้องการใบเสนอราคาพิมพ์ว่า "ขอราคา [สินค้า]" ได้เลยครับ',
                    },
                ]);
            }
        }
    }
    async upsertSender(groupId, lineUserId) {
        const profile = await this.lineApi.getGroupMemberProfile(groupId, lineUserId);
        await this.firebase.db.collection('lineUsers').doc(lineUserId).set({
            lineUserId,
            displayName: profile?.displayName || null,
            pictureUrl: profile?.pictureUrl || null,
            updatedAt: new Date(),
        }, { merge: true });
        const groupRef = this.firebase.db.collection('lineGroups').doc(groupId);
        await groupRef.collection('memberships').doc(lineUserId).set({
            lineUserId,
            lineGroupId: groupId,
            isActive: true,
            updatedAt: new Date(),
        }, { merge: true });
    }
};
exports.LineWebhookService = LineWebhookService;
exports.LineWebhookService = LineWebhookService = LineWebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        line_api_service_1.LineApiService,
        ai_service_1.AiService,
        sessions_service_1.SessionsService,
        quotations_service_1.QuotationsService])
], LineWebhookService);
