import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { ClassRoomSearchQueryDto } from "src/common/dto/classRoomSearchQueryDto";

const feeStructureSortByQuery = {
    amount: 'feeStructure.amount',
}

export class FeeStructureQueryDto extends ClassRoomSearchQueryDto {
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