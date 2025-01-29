import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsUUID, Min } from "class-validator";

export class CreateFeeStructureDto {
    @ApiProperty({ format: 'uuid', description: 'Class room id' })
    @IsUUID()
    classRoomId: string;

    @ApiProperty({ format: 'uuid', description: 'Charge head id' })
    @IsUUID()
    chargeHeadId: string;

    @ApiProperty({ description: 'Amount', type: 'number', minimum: 0 })
    @IsNumber()
    @Min(0)
    amount: number;
}
