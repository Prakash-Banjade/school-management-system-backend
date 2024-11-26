import { Inject, Injectable } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { FastifyRequest } from "fastify";
import { BaseRepository } from "src/common/repository/base-repository";
import { DataSource } from "typeorm";
import { FeeInvoice } from "./entities/fee-invoice.entity";
import { Student } from "src/students/entities/student.entity";
import { PdfAttachmentService } from "src/mail/pdf.service";
import { MailEvents } from "src/mail/mail.service";
import { FeeInvoiceCreatedEventDto } from "src/mail/dto/events.dto";
import { EMonth } from "src/common/types/months";
import { thisSchool } from "src/common/CONSTANTS";
import { FeeInvoicePdf } from "./interfaces/fee-invoice-pdf.interface";
import { ToWords } from "to-words";
export const toWords = new ToWords();

export class FeeInvoiceCreatedEvent {
    feeInvoice: FeeInvoice;
    studentId: string;

    constructor({ feeInvoice, studentId }: { feeInvoice: FeeInvoice, studentId: string }) {
        this.feeInvoice = feeInvoice;
        this.studentId = studentId;
    }
}

@Injectable()
export class FeeInvoiceMailer extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly eventEmitter: EventEmitter2,
        private readonly pdfAttachmentService: PdfAttachmentService,
    ) { super(dataSource, req); }

    @OnEvent('feeInvoice.created')
    async onFeeInvoiceCreated({ feeInvoice, studentId }: FeeInvoiceCreatedEvent) {
        const student = await this.getRepository(Student).createQueryBuilder('student')
            .where('student.id = :studentId', { studentId })
            .leftJoin('student.guardians', 'guardians', 'guardians.receiveNotification = 1')
            .leftJoin('student.classRoom', 'classRoom')
            .leftJoin('classRoom.parent', 'parent')
            .select([
                'student.id',
                'student.firstName',
                'student.lastName',
                'guardians.phone',
                'guardians.email',
                'guardians.firstName',
                'guardians.lastName',
                'classRoom.name',
                'parent.name'
            ])
            .getOne();

        if (!student) return;

        const feeMonth = Object.entries(EMonth).find(([_, monthInd]) => +feeInvoice.month === +monthInd)?.[0]

        for (const guardian of student.guardians) {
            if (!guardian?.email) continue;

            const pdfHtml = await this.pdfAttachmentService.renderTemplate<FeeInvoicePdf>('fee-system/fee-invoice-created-pdf', {
                charges: feeInvoice.items.map(item => ({
                    amount: item.amount?.toLocaleString(),
                    discount: item.discount?.toString(),
                    name: item?.chargeHead?.name,
                    total: (item.amount - (item.amount * item.discount / 100)).toLocaleString(),
                })),
                className: student.classRoom?.parent?.name ?? student.classRoom?.name,
                dueDate: feeInvoice.dueDate,
                invoiceDate: feeInvoice.invoiceDate,
                invoiceNumber: feeInvoice.invoiceNo,
                monthUpto: feeMonth,
                schoolAddress: thisSchool.address,
                schoolLogo: thisSchool.logo,
                schoolPhone: thisSchool.phone,
                studentId: student.studentId?.toString(),
                studentName: student.firstName + ' ' + student.lastName,
                grandTotal: feeInvoice.totalAmount?.toLocaleString(),
                amountInWords: toWords.convert(feeInvoice.totalAmount, { currency: true, ignoreZeroCurrency: true }),
            })
            const buffer = await this.pdfAttachmentService.generatePdf(pdfHtml);

            await this.eventEmitter.emitAsync(MailEvents.FEE_INVOICE_CREATED, new FeeInvoiceCreatedEventDto({
                currency: 'Rs.',
                invoiceMonth: feeMonth,
                invoiceYear: new Date().getFullYear()?.toString(),
                parentName: guardian.firstName + ' ' + guardian.lastName,
                parentMail: guardian.email,
                totalAmount: feeInvoice.totalAmount,
                studentName: student.firstName + ' ' + student.lastName,
                schoolName: thisSchool.name,
                subject: `fee-invoice-${feeMonth.slice(0, 3)?.toLowerCase()}`,
                attachments: [
                    {
                        filename: `fee-invoice-${feeMonth.slice(0, 3)?.toLowerCase()}`,
                        content: buffer,
                    }
                ]
            }))
        }
    }
}