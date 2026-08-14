import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { QuotationsService } from './quotations.service';
import { PdfService } from '../pdf/pdf.service';
import { wrcQuotationTemplate } from '../pdf/templates/wrc-quotation.template';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('quotations')
@Controller('quotations')
export class QuotationsController {
  constructor(
    private readonly quotationsService: QuotationsService,
    private readonly pdfService: PdfService,
    private readonly firebase: FirebaseService,
  ) {}

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Get a quotation PDF by ID' })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  async getQuotationPdf(@Param('id') id: string, @Res() res: Response) {
    const quotation: any = await this.quotationsService.findOne(id);
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    // Try to fetch customer name if possible, otherwise fallback
    let customerName = 'ทั่วไป';
    if (quotation.groupId) {
      try {
        const groupDoc = await this.firebase.db.collection('lineGroups').doc(quotation.groupId).get();
        if (groupDoc.exists) {
          customerName = groupDoc.data()?.groupName || 'ทั่วไป';
        }
      } catch (e) {
        // Ignore
      }
    }

    const templateData = {
      documentNumber: quotation.id,
      customerName,
      items: quotation.items || [],
      subtotal: quotation.subtotal || 0,
      vat: quotation.vat || 0,
      total: quotation.grandTotal || 0, 
    };

    const htmlContent = wrcQuotationTemplate(templateData);

    // Return HTML directly and trigger print dialog for the user
    const htmlWithPrint = htmlContent.replace('</body>', '<script>window.onload = function() { window.print(); }</script></body>');

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
    });

    res.end(htmlWithPrint);
  }
}
