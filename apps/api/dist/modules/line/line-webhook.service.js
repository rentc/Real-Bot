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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
const approvals_service_1 = require("../approvals/approvals.service");
const orders_service_1 = require("../orders/orders.service");
let LineWebhookService = LineWebhookService_1 = class LineWebhookService {
    constructor(firebase, lineApi, aiService, sessionsService, quotationsService, approvalsService, ordersService) {
        this.firebase = firebase;
        this.lineApi = lineApi;
        this.aiService = aiService;
        this.sessionsService = sessionsService;
        this.quotationsService = quotationsService;
        this.approvalsService = approvalsService;
        this.ordersService = ordersService;
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
        const memberCount = await this.lineApi.getGroupMemberCount(groupId);
        await this.firebase.db.collection('lineGroups').doc(groupId).set({
            lineGroupId: groupId,
            groupName: groupSummary?.groupName || null,
            memberCount: memberCount || 0,
            status: 'PENDING_CONFIGURATION',
            botJoinedAt: new Date(),
            updatedAt: new Date(),
        }, { merge: true });
        if (event.replyToken) {
            await this.lineApi.reply(event.replyToken, [
                {
                    type: 'text',
                    text: '🤖 สวัสดีครับ ผมคือ WRC Sales Bot / Hello, I am WRC Sales Bot\n\nผมพร้อมช่วยเรื่องใบเสนอราคา สอบถามราคา และติดตามสถานะคำสั่งซื้อ / I can help you with quotations, pricing, and tracking orders.\n\nพิมพ์ "ขอราคา NYY 4x6 100 เมตร" หรือใช้คำสั่ง #quote ได้เลยครับ / Type "Quote NYY 4x6 100m" or use the #quote command.',
                },
                {
                    type: 'text',
                    text: '⚠️ เพื่อให้ระบบรู้จักและสามารถกำหนดสิทธิ์การสั่งซื้อให้คุณได้ กรุณาพิมพ์ทักทาย (เช่น "สวัสดี" หรือ "Hi") เข้ามาในกลุ่มนี้คนละ 1 ข้อความครับ / To help me recognize you and assign proper roles, please have everyone send a quick greeting (like "Hi" or "Hello") in this group!',
                }
            ]);
        }
        this.sweepGroupMembers(groupId).catch(err => {
            this.logger.error(`Failed to sweep group members for ${groupId}`, err);
        });
    }
    async sweepGroupMembers(groupId) {
        this.logger.log(`Sweeping existing members for group ${groupId}`);
        const memberIds = await this.lineApi.getAllGroupMemberIds(groupId);
        this.logger.log(`Found ${memberIds.length} members in group ${groupId}`);
        const batch = this.firebase.db.batch();
        const groupMembershipsRef = this.firebase.db.collection('lineGroups').doc(groupId).collection('memberships');
        for (const userId of memberIds) {
            const userRef = this.firebase.db.collection('lineUsers').doc(userId);
            batch.set(userRef, {
                lineUserId: userId,
                updatedAt: new Date(),
            }, { merge: true });
            const membershipRef = groupMembershipsRef.doc(userId);
            batch.set(membershipRef, {
                lineUserId: userId,
                lineGroupId: groupId,
                isActive: true,
                updatedAt: new Date(),
            }, { merge: true });
        }
        if (memberIds.length > 0) {
            await batch.commit();
            this.logger.log(`Successfully swept ${memberIds.length} members for group ${groupId}`);
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
    async isAdminUser(groupId, userId) {
        try {
            const membershipRef = this.firebase.db
                .collection('lineGroups').doc(groupId)
                .collection('memberships').doc(userId);
            const rolesSnapshot = await membershipRef.collection('roles')
                .where('isActive', '==', true).get();
            if (!rolesSnapshot.empty) {
                const roleId = rolesSnapshot.docs[0].data().roleId;
                return roleId === 'admin' || roleId === 'ADMIN';
            }
        }
        catch (e) {
            this.logger.error('Failed to check admin role', e);
        }
        return false;
    }
    hasQuotationKeyword(text) {
        const t = text.toLowerCase();
        return t.includes('ขอราคา') || t.includes('quote') || t.includes('price') || t.includes('ราคา');
    }
    async handleMessage(event) {
        if (event.source.type !== 'group')
            return;
        const groupId = event.source.groupId;
        const userId = event.source.userId;
        if (!groupId || !userId)
            return;
        await this.upsertSender(groupId, userId);
        await this.upsertGroup(groupId);
        const message = event.message;
        if (!message)
            return;
        const isAdmin = await this.isAdminUser(groupId, userId);
        if (message.type === 'text' && message.text) {
            if (isAdmin && !this.hasQuotationKeyword(message.text)) {
                return;
            }
            const isRelevant = this.isRelevantMessage(message);
            if (!isRelevant)
                return;
            await this.handleTextMessage(event, message.text, groupId, userId);
        }
        else if (message.type === 'image') {
            if (isAdmin)
                return;
            await this.handleImageMessage(event, message.id, groupId, userId);
        }
        else if (message.type === 'file') {
            if (isAdmin)
                return;
            const isRelevant = this.isRelevantMessage(message);
            if (!isRelevant)
                return;
            await this.handleFileMessage(event, message, groupId, userId);
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
            const businessKeywords = ['ราคา', 'เช็คสต๊อก', 'quote', 'price'];
            if (businessKeywords.some((kw) => text.includes(kw))) {
                return true;
            }
        }
        if (message.type === 'image') {
            return true;
        }
        if (message.type === 'file' && message.fileName && message.fileName.toLowerCase().endsWith('.pdf')) {
            return true;
        }
        return false;
    }
    async handleImageMessage(event, messageId, groupId, userId) {
        const replyToken = event.replyToken;
        if (!replyToken)
            return;
        const pendingOrder = await this.ordersService.findPendingOrderForGroup(groupId);
        try {
            const imageBuffer = await this.lineApi.getContent(messageId);
            let isSlip = false;
            if (pendingOrder) {
                const verificationResult = await this.aiService.verifyPaymentSlip(imageBuffer);
                isSlip = verificationResult.isSlip;
                if (isSlip) {
                    const orderTotal = pendingOrder.total;
                    const slipAmount = verificationResult.amount || 0;
                    const receiverName = (verificationResult.receiverName || '').toLowerCase();
                    const isValidName = receiverName.includes('วรรณรัฐชาติ') ||
                        receiverName.includes('วิศวกรรม') ||
                        receiverName.includes('wannaratchat');
                    const isValidAmount = Math.abs(slipAmount - orderTotal) < 1;
                    if (isValidAmount && isValidName) {
                        let slipUrl = '';
                        try {
                            const fileName = `slips/${pendingOrder.id}-${Date.now()}.jpg`;
                            const file = this.firebase.storage.file(fileName);
                            await file.save(imageBuffer, {
                                metadata: { contentType: 'image/jpeg' }
                            });
                            await file.makePublic();
                            slipUrl = `https://storage.googleapis.com/${this.firebase.storage.name}/${fileName}`;
                        }
                        catch (uploadError) {
                            this.logger.error('Failed to upload slip image', uploadError);
                        }
                        await this.ordersService.markOrderPaid(pendingOrder.id, verificationResult, slipUrl);
                        await this.lineApi.reply(replyToken, [{
                                type: 'text',
                                text: `✅ สลิปถูกต้อง ระบบได้รับหลักฐานการโอนเงินแล้วครับ / Payment proof received.\nหมายเลขคำสั่งซื้อ (Order Number): ${pendingOrder.orderNumber}\nยอดเงินที่ตรวจพบ (Amount Detected): ฿${slipAmount}\nแอดมินจะทำการตรวจสอบและยืนยันอีกครั้งครับ / Admin will review and confirm shortly.`
                            }]);
                    }
                    else {
                        await this.lineApi.reply(replyToken, [{
                                type: 'text',
                                text: `⚠️ ตรวจพบสลิปโอนเงิน แต่ยอดเงินหรือชื่อบัญชีไม่ถูกต้อง (${pendingOrder.orderNumber}) / Slip detected, but amount or account name is incorrect.\nยอดที่ต้องชำระ (Expected Amount): ฿${orderTotal}\nยอดในสลิป (Slip Amount): ฿${slipAmount || 0}\nชื่อบัญชีรับโอน (Receiver Name): ${verificationResult.receiverName || 'ไม่ทราบ'}\nแอดมินจะเข้ามาตรวจสอบอีกครั้งครับ / Admin will manually review this.`
                            }]);
                    }
                }
            }
            if (!isSlip) {
                const extraction = await this.aiService.extractQuotationFromMedia(imageBuffer, 'image/jpeg');
                if (extraction.intent === 'QUOTE' || extraction.intent === 'PRICE') {
                    await this.processQuotationRequest('tenant_wrc_main', groupId, userId, replyToken, extraction);
                }
            }
        }
        catch (e) {
            this.logger.error('Error handling image message', e);
        }
    }
    async handleFileMessage(event, message, groupId, userId) {
        const replyToken = event.replyToken;
        if (!replyToken)
            return;
        try {
            const fileBuffer = await this.lineApi.getContent(message.id);
            const extraction = await this.aiService.extractQuotationFromMedia(fileBuffer, 'application/pdf');
            if (extraction.intent === 'QUOTE' || extraction.intent === 'PRICE') {
                await this.processQuotationRequest('tenant_wrc_main', groupId, userId, replyToken, extraction);
            }
        }
        catch (e) {
            this.logger.error('Error handling file message', e);
        }
    }
    async handleTextMessage(event, text, groupId, userId) {
        const replyToken = event.replyToken;
        if (replyToken) {
            await this.sessionsService.upsertSession(groupId, userId, { lastMessage: text });
            if (text.startsWith('#order')) {
                const parts = text.split(' ');
                if (parts.length < 2) {
                    await this.lineApi.reply(replyToken, [{ type: 'text', text: 'กรุณาระบุหมายเลขใบเสนอราคาที่ต้องการสั่งซื้อ / Please specify the quotation number to order (e.g. #order QT-123)' }]);
                    return;
                }
                const quotationId = parts[1];
                try {
                    const order = await this.ordersService.createOrderFromQuotation(quotationId, userId);
                    await this.lineApi.reply(replyToken, [{
                            type: 'text',
                            text: `✅ ยืนยันการสั่งซื้อเรียบร้อยแล้วครับ / Order confirmed successfully.\nหมายเลขคำสั่งซื้อ (Order Number): ${order.orderNumber}\nแอดมินจะติดต่อกลับโดยเร็วที่สุดครับ / Admin will contact you shortly.\n\nสามารถชำระเงินได้ที่ (Payment Details):\nธนาคารกสิกรไทย (Kasikornbank)\nชื่อบัญชี (Account Name): บจก.วรรณรัฐชาติ วิศวกรรม\nเลขที่บัญชี (Account No): 117-8-14118-6`
                        }]);
                }
                catch (e) {
                    this.logger.error('Error creating order', e);
                    await this.lineApi.reply(replyToken, [{ type: 'text', text: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ กรุณาตรวจสอบว่าใบเสนอราคานี้ได้รับการอนุมัติแล้วหรือยังครับ / Error creating order. Please ensure the quotation is approved.' }]);
                }
                return;
            }
            const extraction = await this.aiService.extractQuotationRequest(text);
            const isQuotationKeyword = text.includes('ราคา') || text.toLowerCase().includes('quote') || text.toLowerCase().includes('price');
            if (extraction.intent === 'QUOTE' || extraction.intent === 'PRICE' || isQuotationKeyword) {
                await this.processQuotationRequest('tenant_wrc_main', groupId, userId, replyToken, extraction, true);
            }
            else {
                await this.lineApi.reply(replyToken, [
                    {
                        type: 'text',
                        text: '🤖 รับทราบครับ หากต้องการใบเสนอราคาพิมพ์ว่า "ขอราคา [สินค้า]" ได้เลยครับ / Understood. If you need a quotation, please type "Quote [Product]".',
                    },
                ]);
            }
        }
    }
    async processQuotationRequest(tenantId, groupId, userId, replyToken, extraction, isText = false) {
        if (extraction.items && extraction.items.length > 0) {
            try {
                const quote = await this.quotationsService.generateDraftQuotation(tenantId, groupId, userId, extraction.items);
                await this.approvalsService.submitQuotationForApproval(quote.id, userId, tenantId);
                let replyText = `📝 สร้างใบเสนอราคา (Draft) เรียบร้อยแล้ว / Quotation (Draft) created\n`;
                replyText += `หมายเลขอ้างอิง (Ref No): ${quote.id}\n\n`;
                replyText += `รายการ (Items):\n`;
                const formatCurrency = (amount) => {
                    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                };
                for (const item of quote.items) {
                    replyText += `- ${item.name} x ${item.quantity} = ฿${formatCurrency(item.total)}\n`;
                    if (item.note) {
                        replyText += `  *หมายเหตุ (Note): ${item.note}*\n`;
                    }
                }
                const userProfile = await this.lineApi.getGroupMemberProfile(groupId, userId);
                const displayName = userProfile?.displayName || 'ลูกค้า / Customer';
                replyText += `\nยอดรวม (Subtotal): ฿${formatCurrency(quote.subtotal)}\n`;
                replyText += `VAT 7%: ฿${formatCurrency(quote.vat)}\n`;
                replyText += `ยอดสุทธิ (Grand Total): ฿${formatCurrency(quote.grandTotal)}`;
                let adminMessage = `⚠️ มีใบเสนอราคาใหม่รอการอนุมัติ / New quotation pending approval\n`;
                adminMessage += `ผู้ขอ (Requested by): ⚙️ ${displayName}\n\n`;
                adminMessage += `แอดมินสามารถตรวจสอบและอนุมัติได้ที่ / Admin can review and approve here:\n`;
                adminMessage += `https://real-bot-6a793.web.app/quotations`;
                await this.lineApi.reply(replyToken, [
                    { type: 'text', text: replyText },
                    { type: 'text', text: adminMessage }
                ]);
            }
            catch (e) {
                this.logger.error('Error generating quotation', e);
                await this.lineApi.reply(replyToken, [{ type: 'text', text: 'เกิดข้อผิดพลาดในการสร้างใบเสนอราคา กรุณาลองใหม่อีกครั้ง / Error generating quotation. Please try again.' }]);
            }
        }
        else if (isText) {
            await this.lineApi.reply(replyToken, [
                {
                    type: 'text',
                    text: 'ผมไม่พบข้อมูลสินค้าที่ต้องการขอราคา กรุณาระบุ ชนิด ขนาด และจำนวน เช่น "ขอราคา NYY 4x6 100 เมตร" หรือแนบรูปภาพ/เอกสาร / I could not find the product details. Please specify type, size, and quantity (e.g. "Quote NYY 4x6 100m"), or attach a document.',
                },
            ]);
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
    async upsertGroup(groupId) {
        try {
            const groupRef = this.firebase.db.collection('lineGroups').doc(groupId);
            const groupSnap = await groupRef.get();
            const now = Date.now();
            const data = groupSnap.data();
            const lastUpdate = data?.groupSummaryUpdatedAt?.toMillis() || 0;
            if (now - lastUpdate > 3600000) {
                const summary = await this.lineApi.getGroupSummary(groupId);
                const memberCount = await this.lineApi.getGroupMemberCount(groupId);
                let updates = {
                    groupSummaryUpdatedAt: new Date(),
                };
                if (summary && summary.groupName) {
                    updates.groupName = summary.groupName;
                    updates.pictureUrl = summary.pictureUrl || null;
                }
                if (memberCount !== null) {
                    updates.memberCount = memberCount;
                }
                await groupRef.set(updates, { merge: true });
            }
        }
        catch (e) {
            this.logger.error('Error in upsertGroup', e);
        }
    }
};
exports.LineWebhookService = LineWebhookService;
exports.LineWebhookService = LineWebhookService = LineWebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => approvals_service_1.ApprovalsService))),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        line_api_service_1.LineApiService,
        ai_service_1.AiService,
        sessions_service_1.SessionsService,
        quotations_service_1.QuotationsService,
        approvals_service_1.ApprovalsService,
        orders_service_1.OrdersService])
], LineWebhookService);
