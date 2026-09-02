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

    // Sweep all existing members asynchronously so it doesn't block
    this.sweepGroupMembers(groupId).catch(err => {
      this.logger.error(`Failed to sweep group members for ${groupId}`, err);
    });
  }

  private async sweepGroupMembers(groupId: string): Promise<void> {
    this.logger.log(`Sweeping existing members for group ${groupId}`);
    const memberIds = await this.lineApi.getAllGroupMemberIds(groupId);
    this.logger.log(`Found ${memberIds.length} members in group ${groupId}`);

    const batch = this.firebase.db.batch();
    const groupMembershipsRef = this.firebase.db.collection('lineGroups').doc(groupId).collection('memberships');

    for (const userId of memberIds) {
      // 1. We also need to upsert the sender profile to lineUsers
      // But fetching profiles for all members could hit rate limits, so we only save the ID for now
      // and update the display name later when they interact, or we could fetch here.
      // Let's just save basic info to memberships and lineUsers without the heavy profile fetch for each.
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

  private async isAdminUser(groupId: string, userId: string): Promise<boolean> {
    try {
      const membershipRef = this.firebase.db
        .collection('lineGroups').doc(groupId)
        .collection('memberships').doc(userId);
      const rolesSnapshot = await membershipRef.collection('roles')
        .where('isActive', '==', true).get();
      if (!rolesSnapshot.empty) {
        const roleId = rolesSnapshot.docs[0].data().roleId as string;
        return roleId === 'admin' || roleId === 'ADMIN';
      }
    } catch (e) {
      this.logger.error('Failed to check admin role', e);
    }
    return false;
  }

  private hasQuotationKeyword(text: string): boolean {
    const t = text.toLowerCase();
    return t.includes('ขอราคา') || t.includes('quote') || t.includes('price') || t.includes('ราคา');
  }

  private async handleMessage(event: LineEvent): Promise<void> {
    this.logger.log(`[Webhook] Handling message from source type: ${event.source.type}`);
    // Support both group and 1-on-1 chats. For 1-on-1, use userId as groupId.
    const groupId = event.source.groupId || event.source.userId;
    const userId = event.source.userId;
    
    if (!groupId || !userId) {
      this.logger.warn(`[Webhook] Ignored event due to missing groupId or userId. Source: ${JSON.stringify(event.source)}`);
      return;
    }

    await this.upsertSender(groupId, userId);
    await this.upsertGroup(groupId);

    const message = event.message;
    if (!message) return;

    // Check if sender is admin
    const isAdmin = await this.isAdminUser(groupId, userId);

    if (message.type === 'text' && message.text) {
      // Admin: only process if message explicitly contains quotation keywords or starts with # (commands)
      if (isAdmin && !this.hasQuotationKeyword(message.text) && !message.text.startsWith('#')) {
        this.logger.log(`[Webhook] Blocked admin message: ${message.text}`);
        return;
      }
      const isRelevant = this.isRelevantMessage(message);
      this.logger.log(`[Webhook] Text message: "${message.text}", isAdmin: ${isAdmin}, isRelevant: ${isRelevant}`);
      if (!isRelevant) return;
      await this.handleTextMessage(event, message.text, groupId, userId);
    } else if (message.type === 'image') {
      await this.handleImageMessage(event, message.id, groupId, userId, isAdmin);
    } else if (message.type === 'file') {
      // Admin sending file → skip entirely
      if (isAdmin) return;
      const isRelevant = this.isRelevantMessage(message);
      if (!isRelevant) return;
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

  private async handleImageMessage(event: LineEvent, messageId: string, groupId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    this.logger.log(`[Webhook] Processing image message ${messageId} from ${userId} (isAdmin: ${isAdmin}) in group ${groupId}`);
    const replyToken = event.replyToken;
    if (!replyToken) return;
    
    // Check if there is a pending order for this group before invoking AI
    const pendingOrder = await this.ordersService.findPendingOrderForGroup(groupId);
    this.logger.log(`[Webhook] Pending order for group ${groupId}: ${pendingOrder ? pendingOrder.orderNumber : 'None'}`);

    try {
      const imageBuffer = await this.lineApi.getContent(messageId);
      let isSlip = false;

      // 1. If there is a pending order, check if this image is a payment slip
      if (pendingOrder) {
        this.logger.log(`[Webhook] Pending order exists. Checking if image is payment slip with Gemini Vision...`);
        const verificationResult = await this.aiService.verifyPaymentSlip(imageBuffer);
        this.logger.log(`[Webhook] AI Slip Verification Result: ${JSON.stringify(verificationResult)}`);
        isSlip = verificationResult.isSlip;
        
        if (isSlip) {
          const orderTotal = pendingOrder.total;
          const slipAmount = verificationResult.amount || 0;
          const isValidAmount = Math.abs(slipAmount - orderTotal) < 1;

          if (isValidAmount) {
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
            return;
          } else {
            await this.lineApi.reply(replyToken as string, [{ 
              type: 'text', 
              text: `⚠️ ตรวจพบสลิปโอนเงิน แต่ยอดเงินหรือชื่อบัญชีไม่ถูกต้อง (${pendingOrder.orderNumber}) / Slip detected, but amount or account name is incorrect.\nยอดที่ต้องชำระ (Expected Amount): ฿${orderTotal}\nยอดในสลิป (Slip Amount): ฿${slipAmount || 0}\nชื่อบัญชีรับโอน (Receiver Name): ${verificationResult.receiverName || 'ไม่ทราบ'}\nแอดมินจะเข้ามาตรวจสอบอีกครั้งครับ / Admin will manually review this.` 
            }]);
            return;
          }
        }
        // NOTE: If isSlip is false, do NOT abort here!
        // Fall through to check if the image is a quotation / pricing request (e.g. handwritten list, BOQ).
      }

      // 2. Check if the image contains a quotation/pricing request (e.g. handwritten note, BOQ, cable list)
      this.logger.log(`[Webhook] Checking if image is quotation / cable request...`);
      const extraction = await this.aiService.extractQuotationFromMedia(imageBuffer, 'image/jpeg');
      this.logger.log(`[Webhook] AI Extraction Result: ${JSON.stringify(extraction)}`);

      if (extraction && (extraction.intent === 'QUOTE' || extraction.intent === 'PRICE' || (extraction.items && extraction.items.length > 0))) {
        await this.processQuotationRequest('tenant_wrc_main', groupId, userId, replyToken as string, extraction);
        return;
      }

      // 3. If neither a valid slip nor quotation items were detected:
      if (pendingOrder) {
        await this.lineApi.reply(replyToken as string, [{ 
          type: 'text', 
          text: `⚠️ ระบบไม่สามารถอ่านข้อมูลสลิปโอนเงินหรือรายการขอราคาได้ กรุณาถ่ายรูปให้ชัดเจนและส่งใหม่อีกครั้งครับ / Could not detect a payment slip or quotation request. Please send a clearer image.` 
        }]);
        return;
      }

      if (isAdmin) {
        await this.lineApi.reply(replyToken as string, [{ 
          type: 'text', 
          text: `⚠️ ไม่พบรายการขอราคา หรือหากนี่คือสลิปโอนเงิน ยังไม่พบคำสั่งซื้อที่รอชำระเงินในขณะนี้ครับ / No quotation items detected, and no pending order found.` 
        }]);
        return;
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
      
      const lowerText = text.trim().toLowerCase();
      // Handle #order command
      if (lowerText.startsWith('#order')) {
        const parts = text.split(' ');
        if (parts.length < 2) {
           await this.lineApi.reply(replyToken as string, [{ type: 'text', text: 'กรุณาระบุหมายเลขใบเสนอราคาที่ต้องการสั่งซื้อ / Please specify the quotation number to order (e.g. #order QT-123)' }]);
           return;
        }
        const quotationId = parts[1].trim(); // trim to avoid issues with extra spaces
        this.logger.log(`[Webhook] Processing #order for quotation: ${quotationId}`);
        try {
          const order = await this.ordersService.createOrderFromQuotation(quotationId, userId);
          this.logger.log(`[Webhook] Order created successfully: ${order.orderNumber}`);
          await this.lineApi.reply(replyToken as string, [{ 
            type: 'text', 
            text: `✅ ยืนยันการสั่งซื้อเรียบร้อยแล้วครับ / Order confirmed successfully.\nหมายเลขคำสั่งซื้อ (Order Number): ${order.orderNumber}\n\nสามารถชำระเงินได้ที่ (Payment Details):\nธนาคารกสิกรไทย (Kasikornbank)\nชื่อบัญชี (Account Name): บจก.วรรณรัฐชาติ วิศวกรรม\nเลขที่บัญชี (Account No): 117-8-14118-6\n\nเมื่อชำระเงินแล้ว กรุณาส่งรูปสลิปโอนเงินมาในแชทนี้เพื่อยืนยันการชำระเงินครับ / After payment, please send the transfer slip image here for confirmation.` 
          }]);
        } catch (e: any) {
          this.logger.error(`Error creating order for ${quotationId}: ${e.message}`, e.stack);
          await this.lineApi.reply(replyToken as string, [{ type: 'text', text: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ กรุณาตรวจสอบว่าใบเสนอราคานี้ได้รับการอนุมัติแล้วหรือยังครับ / Error creating order. Please ensure the quotation is approved.' }]);
        }
        return;
      }
      
      // 2. Use AI to extract intent and items
      const extraction = await this.aiService.extractQuotationRequest(text);
      
      const isQuotationKeyword = lowerText.includes('ราคา') || lowerText.includes('quote') || lowerText.includes('price');
      if (extraction.intent === 'QUOTE' || extraction.intent === 'PRICE' || isQuotationKeyword) {
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
        const memberCount = await this.lineApi.getGroupMemberCount(groupId);
        
        let updates: any = {
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
    } catch (e) {
      this.logger.error('Error in upsertGroup', e);
    }
  }
}
