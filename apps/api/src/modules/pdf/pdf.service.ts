import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private browser: Browser | null = null;

  async onModuleInit() {
    this.logger.log('Initializing Playwright browser for PDF generation');
    try {
      this.browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    } catch (e) {
      this.logger.error('Failed to launch Playwright browser', e);
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
    if (!this.browser) {
      this.browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    }

    const page: Page = await this.browser.newPage();
    
    try {
      await page.setContent(htmlContent, { waitUntil: 'networkidle' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
      });
      return pdfBuffer;
    } finally {
      await page.close();
    }
  }
}
