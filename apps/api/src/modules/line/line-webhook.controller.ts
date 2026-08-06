import {
  Controller,
  Post,
  Req,
  Res,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LineApiService } from './line-api.service';
import { LineWebhookService } from './line-webhook.service';

@Controller('line')
export class LineWebhookController {
  private readonly logger = new Logger(LineWebhookController.name);

  constructor(
    private readonly lineApi: LineApiService,
    private readonly webhookService: LineWebhookService,
  ) {}

  /**
   * POST /api/line/webhook
   * Receives LINE webhook events, verifies signature, returns 200 quickly,
   * then processes events asynchronously.
   */
  @Post('webhook')
  async handleWebhook(
    @Req() req: Request,
    @Res() reply: Response,
  ) {
    const signature = req.headers['x-line-signature'] as string | undefined;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // 1. Verify LINE signature
    if (!this.lineApi.verifySignature(signature, rawBody)) {
      return reply.status(HttpStatus.UNAUTHORIZED).send({ error: 'Invalid signature' });
    }

    // 2. Process events BEFORE sending 200 OK (to prevent Cloud Function from freezing background tasks)
    const body = req.body as any;
    const events = body?.events || [];

    for (const event of events) {
      try {
        await this.webhookService.processEvent(event);
      } catch (error) {
        this.logger.error(
          `Failed to process webhook event: ${event?.webhookEventId || 'unknown'}`,
          error instanceof Error ? error.stack : error,
        );
      }
    }

    // 3. Return 200 OK after processing
    return reply.status(HttpStatus.OK).send({ status: 'ok' });
  }
}
