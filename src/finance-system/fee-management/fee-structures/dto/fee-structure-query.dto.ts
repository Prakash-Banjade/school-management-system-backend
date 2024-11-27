import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { ClassWithSectionQueryDto } from "src/common/dto/classWithSectionQuery.dto";

const feeStructureSortByQuery = {
    amount: 'feeStructure.amount',
}

export class FeeStructureQueryDto extends ClassWithSectionQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Transform(({ value }) => {
        if (value in feeStructureSortByQuery) return feeStructureSortByQuery[value];
        return 'feeStructure.createdAt';
    })
    sortBy?: string = 'feeStructure.createdAt';

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    chargeHeadType?: string;
}