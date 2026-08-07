import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { DocumentNumberingService } from './document-numbering.service';

@Module({
  providers: [PdfService, DocumentNumberingService],
  exports: [PdfService, DocumentNumberingService],
})
export class PdfModule {}
