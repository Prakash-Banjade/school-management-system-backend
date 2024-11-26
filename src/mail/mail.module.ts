import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { PdfAttachmentService } from './pdf.service';

@Global()
@Module({
  imports: [],
  providers: [
    MailService,
    PdfAttachmentService
  ],
  exports: [
    MailService,
    PdfAttachmentService
  ],
})
export class MailModule { }