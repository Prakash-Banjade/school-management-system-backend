import { Inject, Injectable, NotFoundException, Scope } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FeeItem } from "./entities/fee-item.entity";
import { DataSource, Repository } from "typeorm";
import { CreateFeeItemDto } from "./dto/create-fee-item.dto";
import { FeesType } from "../fees-types/entities/fees-type.entity";
import { UpdateFeeItemDto } from "./dto/update-fee-item.dto";
import { REQUEST } from "@nestjs/core";
import { FeesInvoice } from "./entities/fees-invoice.entity";
import { BaseRepository } from "src/common/repository/base-repository";
import { FastifyRequest } from "fastify";

@Injectable({ scope: Scope.REQUEST })
export class FeeItemsService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        @InjectRepository(FeeItem) private readonly feeItemRepo: Repository<FeeItem>,
        @InjectRepository(FeesType) private readonly feesTypeRepo: Repository<FeesType>,
    ) {
        super(dataSource, req);
    }

    async create(createFeeItemDto: CreateFeeItemDto, defaultFeeInvoice?: FeesInvoice) {
        const feesType = await this.feesTypeRepo.findOne({
            where: {
                id: createFeeItemDto.feesTypeId,
            },
        })
        if (!feesType) throw new NotFoundException('Fees type not found')

        // evaluate fee-invoice
        const feeInvoice = defaultFeeInvoice ? defaultFeeInvoice : await this.getRepository<FeesInvoice>(FeesInvoice).findOne({
            where: {
                id: createFeeItemDto.feeInvoiceId
            }
        })
        if (!feeInvoice) throw new NotFoundException('Fee invoice not found')

        const newFeeItem = this.feeItemRepo.create({
            ...createFeeItemDto,
            amount: feesType.amount,
            feesType,
            feesInvoice: feeInvoice,
        })

        return await this.getRepository<FeeItem>(FeeItem).save(newFeeItem)
    }

    async findOne(id: string) {
        const existing = await this.feeItemRepo.findOne({
            where: { id },
            relations: {
                feesType: true,
            }
        })

        if (!existing) throw new NotFoundException('Fee item not found')

        return existing
    }

    async update(id: string, updateFeeItemDto: UpdateFeeItemDto) {
        const existing = await this.findOne(id)

        // TODO: update the fee invoice as well
        Object.assign(existing, updateFeeItemDto)

        return await this.getRepository<FeeItem>(FeeItem).save(existing)
    }

    async remove(id: string) {
        const existing = await this.findOne(id)
        return await this.feeItemRepo.remove(existing)
    }
}