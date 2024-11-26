import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PdfAttachmentService {
    /**
     * template name should be relative to the templates folder inside dist/mail/templates dir 
     */
    async renderTemplate<T>(templateName: string, data: T): Promise<string> {
        const templatePath = path.join(process.cwd(), 'dist', 'mail', 'templates', `${templateName}.hbs`);
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const template = Handlebars.compile(templateContent);
        return template(data);
    }

    async generatePdf(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfUint8Array = await page.pdf({ format: 'A4' });
        await browser.close();

        // Convert Uint8Array to Buffer
        return Buffer.from(pdfUint8Array);
    }
}
