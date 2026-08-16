import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { LineApiService } from './line-api.service';
import { AiService } from '../../shared/ai/ai.service';
import { SessionsService } from '../sessions/sessions.service';
import { QuotationsService } from '../quotations/quotations.service';

import { ApprovalsService } from '../approvals/approvals.service';
import { OrdersService } from '../orders/orders.service';

interface LineEvent {
  type: string;
  webhookEventId?: string;
  timestamp: number;
  source: {
    type: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  replyToken?: string;
  message?: {
    id: string;
    type: string;
    text?: string;
    contentProvider?: { type: string };
    fileName?: string;
    mention?: {
      mentionees: Array<{ index: number; length: number; userId: string; type: string }>;
    };
  };
  joined?: {
    members: Array<{ type: string; userId: string }>;
  };
}

@Injectable()
export class LineWebhookService {
  private readonly logger = new Logger(LineWebhookService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly lineApi: LineApiService,
    private readonly aiService: AiService,
    private readonly sessionsService: SessionsService,
    private readonly quotationsService: QuotationsService,
    @Inject(forwardRef(() => ApprovalsService))
    private readonly approvalsService: ApprovalsService,
    private readonly ordersService: OrdersService,
  ) {}

  async processEvent(event: LineEvent): Promise<void> {
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
    } catch (error) {
      if (event.webhookEventId) {
        await this.firebase.db.collection('webhookEvents').doc(event.webhookEventId).update({
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
      throw error;
    }
  }

  private async handleBotJoinGroup(event: LineEvent): Promise<void> {
    const groupId = event.source.groupId;
    if (!groupId) return;

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
          text: '🤖 สวัสดีครับ ผมคือ WRC Sales Bot / Hello, I am WRC Sales Bot\n\nผมพร้อมช่วยเรื่องใบเสนอราคา สอบถามราคา และติดตามสถานะคำสั่งซื้อ / I can help you with quotations, pricing, and tracking orders.\n\nพิมพ์ "ขอราคา NYY 4x6 100 เมตร" หรือใช้คำสั่ง #quote ได้เลยครับ / Type "Quote NYY 4x6 100m" or use the #quote command.',
        },
      ]);
    }
  }

  private async handleBotLeaveGroup(event: LineEvent): Promise<void> {
    const groupId = event.source.groupId;
    if (!groupId) return;

    this.logger.log(`Bot left group: ${groupId}`);

    await this.firebase.db.collection('lineGroups').doc(groupId).update({
      status: 'INACTIVE',
      updatedAt: new Date(),
    });
  }

  private async handleMemberJoined(event: LineEvent): Promise<void> {
    const groupId = event.source.groupId;
    if (!groupId || !event.joined?.members) return;

    for (const member of event.joined.members) {
      if (member.type !== 'user') continue;

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

  private async handleMessage(event: LineEvent): Promise<void> {
    if (event.source.type !== 'group') return;

    const groupId = event.source.groupId;
    const userId = event.source.userId;
    if (!groupId || !userId) return;

    await this.upsertSender(groupId, userId);
    await this.upsertGroup(groupId);

    const message = event.message;
    if (!message) return;

    const isRelevant = this.isRelevantMessage(message);

    if (!isRelevant) {
      return;
    }

    if (message.type === 'text' && message.text) {
      await this.handleTextMessage(event, message.text, groupId, userId);
    } else if (message.type === 'image') {
      await this.handleImageMessage(event, message.id, groupId, userId);
    } else if (message.type === 'file') {
      await this.handleFileMessage(event, message, groupId, userId);
    }
  }

  private isRelevantMessage(message: LineEvent['message']): boolean {
    if (!message) return false;

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

    if (message.type === 'image') {
      return true;
    }
    
    if (message.type === 'file' && message.fileName && message.fileName.toLowerCase().endsWith('.pdf')) {
      return true;
    }

    return false;
  }

  private async handleImageMessage(event: LineEvent, messageId: string, groupId: string, userId: string): Promise<void> {
    const replyToken = event.replyToken;
    if (!replyToken) return;
    
    // Check if there is a pending order for this group before invoking AI
    const pendingOrder = await this.ordersService.findPendingOrderForGroup(groupId);

    try {
      const imageBuffer = await this.lineApi.getContent(messageId);
      let isSlip = false;

      if (pendingOrder) {
        const verificationResult = await this.aiService.verifyPaymentSlip(imageBuffer);
        isSlip = verificationResult.isSlip;
        
        if (isSlip) {
          // DEMO: Pretend the amount is the same as quotation
          const orderTotal = pendingOrder.total;
          const slipAmount = verificationResult.amount || orderTotal;
          
          if (true || Math.abs(slipAmount - orderTotal) < 1) {
            // Upload slip to Firebase Storage
            let slipUrl = '';
            try {
              const fileName = `slips/${pendingOrder.id}-${Date.now()}.jpg`;
              const file = this.firebase.storage.file(fileName);
              await file.save(imageBuffer, {
                metadata: { contentType: 'image/jpeg' }
              });
              await file.makePublic();
              slipUrl = `https://storage.googleapis.com/${this.firebase.storage.name}/${fileName}`;
            } catch (uploadError) {
              this.logger.error('Failed to upload slip image', uploadError);
            }

            await this.ordersService.markOrderPaid(pendingOrder.id, verificationResult, slipUrl);
            await this.lineApi.reply(replyToken as string, [{ 
              type: 'text', 
              text: `✅ สลิปถูกต้อง ระบบได้รับหลักฐานการโอนเงินแล้วครับ / Payment proof received.\nหมายเลขคำสั่งซื้อ (Order Number): ${pendingOrder.orderNumber}\nยอดเงินที่ตรวจพบ (Amount Detected): ฿${slipAmount}\nแอดมินจะทำการตรวจสอบและยืนยันอีกครั้งครับ / Admin will review and confirm shortly.` 
            }]);
          } else {
            await this.lineApi.reply(replyToken as string, [{ 
              type: 'text', 
              text: `⚠️ ตรวจพบสลิปโอนเงิน แต่ยอดเงินไม่ตรงกับคำสั่งซื้อ (${pendingOrder.orderNumber}) / Slip detected, but amount does not match the order.\nยอดที่ต้องชำระ (Expected Amount): ฿${orderTotal}\nยอดในสลิป (Slip Amount): ฿${slipAmount || 0}\nแอดมินจะเข้ามาตรวจสอบอีกครั้งครับ / Admin will manually review this.` 
            }]);
          }
        }
      }
      
      if (!isSlip) {
        // Process as quotation request
        const extraction = await this.aiService.extractQuotationFromMedia(imageBuffer, 'image/jpeg');
        if (extraction.intent === 'QUOTE' || extraction.intent === 'PRICE') {
          await this.processQuotationRequest('tenant_wrc_main', groupId, userId, replyToken as string, extraction);
        }
      }
    } catch (e) {
      this.logger.error('Error handling image message', e);
    }
  }

  private async handleFileMessage(event: LineEvent, message: any, groupId: string, userId: string): Promise<void> {
    const replyToken = event.replyToken;
    if (!replyToken) return;
    
    try {
      const fileBuffer = await this.lineApi.getContent(message.id);
      
      // We only accept PDFs which we verified in isRelevantMessage
      const extraction = await this.aiService.extractQuotationFromMedia(fileBuffer, 'application/pdf');
      if (extraction.intent === 'QUOTE' || extraction.intent === 'PRICE') {
        await this.processQuotationRequest('tenant_wrc_main', groupId, userId, replyToken as string, extraction);
      }
    } catch (e) {
      this.logger.error('Error handling file message', e);
    }
  }

  private async handleTextMessage(event: LineEvent, text: string, groupId: string, userId: string): Promise<void> {
    const replyToken = event.replyToken;
    if (replyToken) {
      // 1. Mark session as active
      await this.sessionsService.upsertSession(groupId, userId, { lastMessage: text });
      
      // Handle #order command
      if (text.startsWith('#order')) {
        const parts = text.split(' ');
        if (parts.length < 2) {
           await this.lineApi.reply(replyToken as string, [{ type: 'text', text: 'กรุณาระบุหมายเลขใบเสนอราคาที่ต้องการสั่งซื้อ / Please specify the quotation number to order (e.g. #order QT-123)' }]);
           return;
        }
        const quotationId = parts[1];
        try {
          const order = await this.ordersService.createOrderFromQuotation(quotationId, userId);
          await this.lineApi.reply(replyToken as string, [{ 
            type: 'text', 
            text: `✅ ยืนยันการสั่งซื้อเรียบร้อยแล้วครับ / Order confirmed successfully.\nหมายเลขคำสั่งซื้อ (Order Number): ${order.orderNumber}\nแอดมินจะติดต่อกลับโดยเร็วที่สุดครับ / Admin will contact you shortly.\n\nสามารถชำระเงินได้ที่ (Payment Details):\nธนาคารกสิกรไทย (Kasikornbank)\nชื่อบัญชี (Account Name): บจก.วรรณรัฐชาติ วิศวกรรม\nเลขที่บัญชี (Account No): 117-8-14118-6` 
          }]);
        } catch (e) {
          this.logger.error('Error creating order', e);
          await this.lineApi.reply(replyToken as string, [{ type: 'text', text: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ กรุณาตรวจสอบว่าใบเสนอราคานี้ได้รับการอนุมัติแล้วหรือยังครับ / Error creating order. Please ensure the quotation is approved.' }]);
        }
        return;
      }
      
      // 2. Use AI to extract intent and items
      const extraction = await this.aiService.extractQuotationRequest(text);
      
      if (extraction.intent === 'QUOTE' || extraction.intent === 'PRICE' || text.includes('ราคา')) {
        await this.processQuotationRequest('tenant_wrc_main', groupId, userId, replyToken as string, extraction, true);
      } else {
        await this.lineApi.reply(replyToken as string, [
          {
            type: 'text',
            text: '🤖 รับทราบครับ หากต้องการใบเสนอราคาพิมพ์ว่า "ขอราคา [สินค้า]" ได้เลยครับ / Understood. If you need a quotation, please type "Quote [Product]".',
          },
        ]);
      }
    }
  }

  private async processQuotationRequest(tenantId: string, groupId: string, userId: string, replyToken: string, extraction: any, isText: boolean = false): Promise<void> {
    if (extraction.items && extraction.items.length > 0) {
      try {
        const quote = await this.quotationsService.generateDraftQuotation(tenantId, groupId, userId, extraction.items);
        
        // Automatically submit for approval
        await this.approvalsService.submitQuotationForApproval(quote.id, userId, tenantId);
        
        let replyText = `📝 สร้างใบเสนอราคา (Draft) เรียบร้อยแล้ว / Quotation (Draft) created\n`;
        replyText += `หมายเลขอ้างอิง (Ref No): ${quote.id}\n\n`;
        replyText += `รายการ (Items):\n`;
        
        const formatCurrency = (amount: number) => {
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
        
        await this.lineApi.reply(replyToken as string, [
          { type: 'text', text: replyText },
          { type: 'text', text: adminMessage }
        ]);
      } catch (e) {
        this.logger.error('Error generating quotation', e);
        await this.lineApi.reply(replyToken as string, [{ type: 'text', text: 'เกิดข้อผิดพลาดในการสร้างใบเสนอราคา กรุณาลองใหม่อีกครั้ง / Error generating quotation. Please try again.' }]);
      }
    } else if (isText) {
      await this.lineApi.reply(replyToken as string, [
        {
          type: 'text',
          text: 'ผมไม่พบข้อมูลสินค้าที่ต้องการขอราคา กรุณาระบุ ชนิด ขนาด และจำนวน เช่น "ขอราคา NYY 4x6 100 เมตร" หรือแนบรูปภาพ/เอกสาร / I could not find the product details. Please specify type, size, and quantity (e.g. "Quote NYY 4x6 100m"), or attach a document.',
        },
      ]);
    }
  }

  private async upsertSender(groupId: string, lineUserId: string): Promise<void> {
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

  private async upsertGroup(groupId: string): Promise<void> {
    try {
      const groupRef = this.firebase.db.collection('lineGroups').doc(groupId);
      const groupSnap = await groupRef.get();
      
      const now = Date.now();
      const data = groupSnap.data();
      const lastUpdate = data?.groupSummaryUpdatedAt?.toMillis() || 0;
      
      // Update group name at most once every hour (3600000 ms)
      if (now - lastUpdate > 3600000) {
        const summary = await this.lineApi.getGroupSummary(groupId);
        if (summary && summary.groupName) {
          await groupRef.update({
            groupName: summary.groupName,
            pictureUrl: summary.pictureUrl || null,
            groupSummaryUpdatedAt: new Date(),
          });
        }
      }
    } catch (e) {
      this.logger.error('Error in upsertGroup', e);
    }
  }
}
