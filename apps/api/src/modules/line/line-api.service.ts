import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios, { AxiosResponse } from 'axios';

const LINE_API_BASE = 'https://api.line.me/v2/bot';
const LINE_DATA_API_BASE = 'https://api-data.line.me/v2/bot';

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LineReplyMessage {
  type: string;
  text?: string;
  [key: string]: unknown;
}

@Injectable()
export class LineApiService {
  private readonly logger = new Logger(LineApiService.name);
  private readonly channelSecret: string;
  private readonly channelAccessToken: string;

  constructor(private readonly config: ConfigService) {
    this.channelSecret = this.config.getOrThrow<string>('LINE_CHANNEL_SECRET');
    this.channelAccessToken = this.config.getOrThrow<string>('LINE_CHANNEL_ACCESS_TOKEN');
  }

  /**
   * Verify LINE webhook signature using HMAC-SHA256.
   * Ported from existing line.util.js verifySignature()
   */
  verifySignature(signature: string | undefined, rawBody: Buffer | string): boolean {
    if (!signature) {
      this.logger.error('Missing x-line-signature header');
      return false;
    }

    let body: Buffer | string = rawBody;
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

  /**
   * Reply to a LINE message using the reply token.
   * Ported from existing line.util.js reply()
   */
  async reply(replyToken: string, messages: LineReplyMessage[]): Promise<void> {
    try {
      await axios.post(
        `${LINE_API_BASE}/message/reply`,
        { replyToken, messages },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        },
      );
    } catch (error) {
      this.logger.error('Failed to send LINE reply', error);
    }
  }

  /**
   * Push a message to a user or group (no reply token needed).
   */
  async pushMessage(to: string, messages: LineReplyMessage[]): Promise<void> {
    try {
      await axios.post(
        `${LINE_API_BASE}/message/push`,
        { to, messages },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to push LINE message to ${to}`, error);
    }
  }

  /**
   * Download message content (image, video, audio, file).
   * Ported from existing line.util.js getContent()
   */
  async getContent(messageId: string): Promise<Buffer> {
    const response: AxiosResponse<ArrayBuffer> = await axios.get(
      `${LINE_DATA_API_BASE}/message/${messageId}/content`,
      {
        headers: {
          Authorization: `Bearer ${this.channelAccessToken}`,
        },
        responseType: 'arraybuffer',
      },
    );
    return Buffer.from(response.data);
  }

  /**
   * Get a group member's profile.
   * Ported from existing line.util.js getGroupMemberProfile()
   */
  async getGroupMemberProfile(groupId: string, userId: string): Promise<LineProfile | null> {
    try {
      const response = await axios.get<LineProfile>(
        `${LINE_API_BASE}/group/${groupId}/member/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch group member profile: ${userId} in ${groupId}`, error);
      return null;
    }
  }

  /**
   * Get group summary (name, icon).
   */
  async getGroupSummary(groupId: string): Promise<{ groupId: string; groupName: string; pictureUrl?: string } | null> {
    try {
      const response = await axios.get(
        `${LINE_API_BASE}/group/${groupId}/summary`,
        {
          headers: {
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch group summary: ${groupId}`, error);
      return null;
    }
  }
}
