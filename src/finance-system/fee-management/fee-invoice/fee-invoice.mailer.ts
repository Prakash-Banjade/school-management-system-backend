import { Inject, Injectable } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { OnEvent } from "@nestjs/event-emitter";
import { FastifyRequest } from "fastify";
import { BaseRepository } from "src/common/repository/base-repository";
import { DataSource } from "typeorm";
import { FeeInvoice } from "./entities/fee-invoice.entity";
import { Guardian } from "src/guardians/entities/guardian.entity";
import { Student } from "src/students/entities/student.entity";

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
    ) { super(dataSource, req); }

    @OnEvent('feeInvoice.created')
    async onFeeInvoiceCreated(feeInvoiceCreatedEvent: FeeInvoiceCreatedEvent) {
        const student = await this.getRepository(Student).createQueryBuilder('student')
            .where('student.id = :studentId', { studentId: feeInvoiceCreatedEvent.studentId })
            .leftJoin('student.guardians', 'guardians', 'guardians.receiveNotification = 1')
            .select(['student.id', 'student.firstName', 'student.lastName', 'guardians.phone', 'guardians.email', 'guardian.firstName', 'guardian.lastName'])
            .getOne();

        console.log(student)
    }
}